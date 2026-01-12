# frozen_string_literal: true

require "faye/websocket"
require "eventmachine"
require "json"
require "securerandom"
require "time"

CLIENTS = {}
BACKLOG = []
BACKLOG_LIMIT = 100
PING_INTERVAL = 25

def safe_send(ws, payload)
  ws.send(JSON.generate(payload))
rescue StandardError
  nil
end

def broadcast(payload)
  CLIENTS.each_value do |ws|
    safe_send(ws, payload)
  end
end

app = lambda do |env|
  if Faye::WebSocket.websocket?(env)
    ws = Faye::WebSocket.new(env)
    client_id = SecureRandom.uuid

    ws.on :open do |_event|
      CLIENTS[client_id] = ws

      safe_send(ws, { type: "hello", client_id: client_id })
      safe_send(ws, { type: "backlog", messages: BACKLOG })
      broadcast({ type: "presence", online: CLIENTS.size })

      ws.instance_variable_set(
        :@ping_timer,
        EM.add_periodic_timer(PING_INTERVAL) { ws.ping }
      )
    end

    ws.on :message do |event|
      data = begin
        JSON.parse(event.data)
      rescue JSON::ParserError
        nil
      end
      next unless data.is_a?(Hash)

      name = data["name"].to_s.strip
      name = "guest" if name.empty?
      text = data["text"].to_s
      next if text.strip.empty?
      next if name.length > 40
      next if text.length > 2000

      if text.match?(/^\/e\s+.+/i)
        message = {
          type: "message",
          id: SecureRandom.uuid,
          at: Time.now.utc.iso8601,
          name: name,
          text: text
        }
        broadcast(message)
        next
      end

      message = {
        type: "message",
        id: SecureRandom.uuid,
        at: Time.now.utc.iso8601,
        name: name,
        text: text
      }

      BACKLOG << message
      BACKLOG.shift while BACKLOG.size > BACKLOG_LIMIT

      broadcast(message)
    end

    ws.on :close do |_event|
      CLIENTS.delete(client_id)
      if (timer = ws.instance_variable_get(:@ping_timer))
        timer.cancel
      end
      broadcast({ type: "presence", online: CLIENTS.size })
      ws = nil
    end

    return ws.rack_response
  end

  [200, { "Content-Type" => "text/plain" }, ["ok"]]
end

run app
