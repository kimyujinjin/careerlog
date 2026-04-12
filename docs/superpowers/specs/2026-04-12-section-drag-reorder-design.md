# 섹션 & 항목 드래그앤드롭 순서 변경

## 개요

버전 편집기에서 이력서 섹션(경력, 스킬, 학력, 자격증)의 순서와 각 섹션 내부 항목의 순서를 드래그앤드롭으로 변경하고, 렌더러 미리보기에 즉시 반영한다.

## 데이터 모델

`createVersion()`에 다음 필드 추가:

```
sectionOrder: []    // 섹션 순서 ['experiences','skills','educations','certifications']
skillOrder: []      // 스킬 그룹 ID 순서
eduOrder: []        // 학력 ID 순서
certOrder: []       // 자격증 ID 순서
```

- `expOrder`는 이미 존재, 그대로 활용
- 빈 배열이면 기본 순서 사용 (현재 하드코딩 순서와 동일)

## 섹션 레벨 드래그

- 대상: 경력, 스킬, 학력, 자격증 (4개 섹션)
- 직책, 자기소개, 메모는 고정 (드래그 불가)
- 각 섹션 헤더 왼쪽에 드래그 핸들(`⠿`) 추가
- HTML5 네이티브 드래그 API 사용 (기존 경력 드래그 패턴과 동일)
- 드래그 시 drag-over 하이라이트 시각 피드백

## 항목 레벨 드래그

- 경력 항목: 기존 `expOrder` 드래그 로직 활용
- 스킬 그룹: `skillOrder`로 순서 관리, 드래그 핸들 추가
- 학력: `eduOrder`로 순서 관리, 드래그 핸들 추가
- 자격증: `certOrder`로 순서 관리, 드래그 핸들 추가

## 확인 모달

- 모든 드래그앤드롭(섹션, 경력, 스킬, 학력, 자격증) 완료 시 확인 모달 표시
- 메시지: "순서를 변경할까요?"
- "변경" 클릭: 순서 저장(`Store.saveVersion()`) + 미리보기 반영(`App.refreshPreview()`)
- "취소" 클릭: 원래 순서로 복원, UI를 이전 상태로 되돌림
- 기존 경력 드래그(`expOrder`)에도 동일 적용

## 렌더러 반영

- `Renderer.render()`의 하드코딩된 섹션 순서를 `sectionOrder` 배열 기반으로 변경
- `Store.resolveVersion()`에서 스킬, 학력, 자격증도 각각 order 배열로 정렬

## 저장 흐름

1. 드래그 완료
2. 확인 모달 표시
3. "변경" 선택 시: version 객체에 order 업데이트 → `Store.saveVersion()` → `App.refreshPreview()`
4. "취소" 선택 시: DOM을 이전 상태로 복원

## 수정 대상 파일

- `js/models.js` — createVersion에 order 필드 추가
- `js/store.js` — resolveVersion에 스킬/학력/자격증 정렬 추가
- `js/version.js` — 섹션/항목 드래그 핸들러, 확인 모달, 기존 경력 드래그에 확인 모달 적용
- `js/renderer.js` — sectionOrder 기반 동적 섹션 렌더링
- `css/app.css` — 드래그 핸들, drag-over 스타일, 확인 모달 스타일
