# LFL-048 Debian dev1 deployment receipt

Date: 2026-11-10 (Asia/Jakarta)  
Environment: Debian laptop fallback at `dev1-rehearse.najala.org`  
Application commit/image: `c308e1f` / `rehearse-app:c308e1f`

The owner-entered label `Full TOEFL Practice Test - ETS 2020 Test A` is 42
characters. The staff adapter previously rejected it at 40 even though the API
accepted up to 80. Both boundaries now accept up to 80 characters, and the
teacher interface explains the eight-tag/eighty-character limits. Invalid
input receives a specific validation message.

Tags remain staff-only. `listManagedResources()` is the only resource query
that selects the tag column. The learner `assignedResources()` query,
`TestCenterResource` DTO, resource API response, and assigned-resource
component have no tag field or tag renderer.

Changed-path ESLint, project TypeScript, `git diff --check`, runner/Next
production build, emergency Compose configuration, and localhost/public health
checks passed. The app-only replacement left the database unchanged at zero
saved tags and zero `tags_updated` events; the owner may retry the original
label. Rollback is an app-only return to `rehearse-app:7bc8e0d`.
