# WebSocket Server on Heroku (Ruby)

Heroku向けの最小構成WebSocketサーバーです。`/` にHTTPアクセスすると稼働確認メッセージを返し、WebSocket接続は受信したメッセージをそのまま `echo:` 付きで返します。

## ローカル起動

```sh
bundle install
bundle exec puma -p 9292 config.ru
```

## 動作確認

- HTTP: `curl http://localhost:9292/`
- WebSocket: 任意のクライアントで `ws://localhost:9292/` に接続

## Herokuデプロイ

```sh
heroku create
heroku buildpacks:set heroku/ruby
heroku deploy:git
```
