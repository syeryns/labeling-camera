# 라벨링 카메라

라벨 목록(덱)을 순서대로 넘기며 촬영하고, 라벨·기호를 얹어 ZIP 폴더로 내보내는 iPhone용 웹앱. 기획은 `라벨링-카메라-앱-PRD.md` 참고.

## 파일

| 파일 | 역할 |
| --- | --- |
| `index.html` | 화면 4개(덱 목록 · 덱 상세 · 편집 · 내보내기) 골격 |
| `style.css` | 다크 모드, 상태별 색, safe-area |
| `app.js` | 전체 로직 (IndexedDB, 촬영, 편집기, ZIP 내보내기) |
| `sw.js` | 오프라인 캐시. 파일을 고쳐 배포할 때 `VERSION`을 올린다 |
| `manifest.json`, `icons/` | 홈 화면 설치 |
| `vendor/jszip.min.js` | JSZip 3.10.1 사본 (오프라인용) |

## 배포 (GitHub Pages)

1. GitHub에 새 저장소를 만들고 이 폴더의 파일을 모두 올린다 (PRD 파일은 빼도 된다).
2. 저장소 **Settings → Pages → Branch: main / (root)** 로 저장.
3. 1~2분 뒤 `https://<아이디>.github.io/<저장소>/` 를 iPhone Safari로 연다.
4. 공유 버튼 → **홈 화면에 추가**. 한 번 연 뒤에는 오프라인에서도 열린다.

카메라는 HTTPS에서만 동작하므로 PC에서 `file://`로 열면 촬영이 되지 않는다.
