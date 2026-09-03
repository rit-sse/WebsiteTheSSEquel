# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0](https://github.com/rit-sse/WebsiteTheSSEquel/compare/v0.1.0...v0.2.0) (2026-09-03)


### Features

* add a soggy cat easter-egg page at /soggycat ([#582](https://github.com/rit-sse/WebsiteTheSSEquel/issues/582)) ([#583](https://github.com/rit-sse/WebsiteTheSSEquel/issues/583)) ([95feb0a](https://github.com/rit-sse/WebsiteTheSSEquel/commit/95feb0abec3e190d4bf940425b122d1c0a1de96c))
* automate semantic versioning releases ([#586](https://github.com/rit-sse/WebsiteTheSSEquel/issues/586)) ([796f5fb](https://github.com/rit-sse/WebsiteTheSSEquel/commit/796f5fbd2240f1307a413fbcd792861618c7f73e))
* enforce RBAC across middleware, dashboard, and profiles ([013ccf7](https://github.com/rit-sse/WebsiteTheSSEquel/commit/013ccf72d61d9d76dc7a127d83d40db694e4627c))


### Bug Fixes

* **#431:** allow all officers to edit handover docs ([de0b816](https://github.com/rit-sse/WebsiteTheSSEquel/commit/de0b81695cf1442cffbf7483d1d2d162586554ca))
* **#441:** configure Dependabot PRs to target development branch ([4878ba5](https://github.com/rit-sse/WebsiteTheSSEquel/commit/4878ba5e61a81d834ab172bb5a7cb3d96c027a49))
* **#442:** allow empty event description and surface DB save errors ([1d9e6c3](https://github.com/rit-sse/WebsiteTheSSEquel/commit/1d9e6c37e8923bf08e76edc1ce7cdf0d013120a7))
* **#443:** allow non-officers to accept invitations ([585c4c2](https://github.com/rit-sse/WebsiteTheSSEquel/commit/585c4c23a946b950964900928560b5610c3687aa))
* complete auth coverage on development routes ([4516019](https://github.com/rit-sse/WebsiteTheSSEquel/commit/451601985b87c9a2f83c7376565586e0f6dd73c0))
* include node check in docker deps stage ([32487ee](https://github.com/rit-sse/WebsiteTheSSEquel/commit/32487ee97b61b53bfa6e98fa80edf7230101d2a5))
* resolve open issues [#431](https://github.com/rit-sse/WebsiteTheSSEquel/issues/431), [#441](https://github.com/rit-sse/WebsiteTheSSEquel/issues/441), [#442](https://github.com/rit-sse/WebsiteTheSSEquel/issues/442), [#443](https://github.com/rit-sse/WebsiteTheSSEquel/issues/443) ([c6f8c08](https://github.com/rit-sse/WebsiteTheSSEquel/commit/c6f8c0881cdb9d175bfac0f8a7b71f706ac39254))
* resolve staging proxy auth by email ([5131619](https://github.com/rit-sse/WebsiteTheSSEquel/commit/51316192fd6b85acc04f61d6fa2fd82f2c3c5c65))
* resolve staging proxy auth by email ([#562](https://github.com/rit-sse/WebsiteTheSSEquel/issues/562)) ([85e9c9c](https://github.com/rit-sse/WebsiteTheSSEquel/commit/85e9c9cd20fe645e78a2617ae6f2d6e91de81091))
* skip legacy membership import ([#565](https://github.com/rit-sse/WebsiteTheSSEquel/issues/565)) ([268aa68](https://github.com/rit-sse/WebsiteTheSSEquel/commit/268aa684d8b35400a4b738566e12c48aadc449ee))

## [Unreleased]

### Added

- Initial draft of the changelog file.
- Enhanced documentation for open sourced contribution.

### Changed

- Display the application release version with the source commit as SemVer
  build metadata.
- Generate version bumps, changelog entries, Git tags, and GitHub Releases from
  Conventional Commits through an automated release pull request.

### Fixed

- Placeholder for future fixes.

## [0.1.0] - 2025-04-09

### Added

- Initial release of the project.
- Most MVP features implemented.

[Unreleased]: https://github.com/rit-sse/WebsiteTheSSEquel/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/rit-sse/WebsiteTheSSEquel/releases/tag/v0.1.0
