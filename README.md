# tts-room

`TTS-Overlay` 전용 실시간 채팅방 서버입니다.

## GitHub에 올릴 파일
이 폴더 안의 아래 파일을 저장소 최상단(root)에 그대로 올리세요.

- `server.js`
- `package.json`
- `render.yaml`
- `README.md`

## Render 설정
- New > Web Service
- GitHub 저장소 Connect
- Language: Node
- Build Command: `npm install`
- Start Command: `npm start`
- Create Web Service

배포가 끝나면 `https://xxxxx.onrender.com` 주소를 TTS Overlay의 **서버 주소**에 넣으세요.

친구들도 같은 서버 주소를 한 번 넣고, 같은 **방 코드**로 참가하면 됩니다.
