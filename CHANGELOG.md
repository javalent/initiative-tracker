# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [7.4.1](https://github.com/valentine195/obsidian-initiative-tracker/compare/7.4.0...7.4.1) (2022-03-22)


### Bug Fixes

* Fixes parsing of display names defined in inline arrays. ([a2ef280](https://github.com/valentine195/obsidian-initiative-tracker/commit/a2ef280db7e37c6832f6dcca784632707a8be962))

## [7.4.0](https://github.com/valentine195/obsidian-initiative-tracker/compare/7.3.4...7.4.0) (2022-03-22)


### Features

* Can now specify display name for creatures in encounter blocks ([b14acc4](https://github.com/valentine195/obsidian-initiative-tracker/commit/b14acc46cbd5c9677774848148b18f2f2f6fe2da))

### [7.3.4](https://github.com/valentine195/obsidian-initiative-tracker/compare/7.3.3...7.3.4) (2022-03-21)


### Bug Fixes

* Wrap encounter table lists in ul ([d9edf7c](https://github.com/valentine195/obsidian-initiative-tracker/commit/d9edf7c3342d992d67a6838285e280029d9e2538))

### [7.3.3](https://github.com/valentine195/obsidian-initiative-tracker/compare/7.3.2...7.3.3) (2022-03-21)


### Bug Fixes

* Encounter Tables now display as a list + have the `encounter-creatures`, `encounter-players` and `encounter-list` CSS classes ([706e7cc](https://github.com/valentine195/obsidian-initiative-tracker/commit/706e7ccbfac2b7eb5041fd5338dc51121b166c8e))

### [7.3.2](https://github.com/valentine195/obsidian-initiative-tracker/compare/7.3.1...7.3.2) (2022-03-07)


### Bug Fixes

* Release was buggy ([c8d3413](https://github.com/valentine195/obsidian-initiative-tracker/commit/c8d34133f9bd258ac089bb01a9d1158bb1e22fb7))

## [7.3.0](https://github.com/valentine195/obsidian-initiative-tracker/compare/7.2.2...7.3.0) (2022-03-04)


### Features

* Can now specify players and party separately (close [#31](https://github.com/valentine195/obsidian-initiative-tracker/issues/31)) ([113a78c](https://github.com/valentine195/obsidian-initiative-tracker/commit/113a78c124a448c6fc6f4f20a7f796fbe82ec569))
* Player names in the tracker are now bolded and receive the `.player` class ([8ff9ab3](https://github.com/valentine195/obsidian-initiative-tracker/commit/8ff9ab34b083ef6374cc96876397c4f518a21e52))

### [7.2.2](https://github.com/valentine195/obsidian-initiative-tracker/compare/7.2.1...7.2.2) (2022-03-03)


### Bug Fixes

* Fixes issue where switching a party in the tracker wouldn't allow parties to be loaded from encounters ([9940382](https://github.com/valentine195/obsidian-initiative-tracker/commit/994038243738b162b7f951058cbce90a038a2956))

### [7.2.1](https://github.com/valentine195/obsidian-initiative-tracker/compare/7.2.0...7.2.1) (2022-02-22)


### Bug Fixes

* update some settings descriptions ([ee33a40](https://github.com/valentine195/obsidian-initiative-tracker/commit/ee33a405277b3f9d09422f6dd5a62b1dc7b75698))

## [7.2.0](https://github.com/valentine195/obsidian-initiative-tracker/compare/7.1.0...7.2.0) (2022-02-22)


### Features

* Adds monster display names (close [#28](https://github.com/valentine195/obsidian-initiative-tracker/issues/28)) ([3b8c0de](https://github.com/valentine195/obsidian-initiative-tracker/commit/3b8c0de80a02fbcc8392ee21a656d274af1f87bf))
* Adds Parties to settings ([353a27d](https://github.com/valentine195/obsidian-initiative-tracker/commit/353a27df5813a8641112523f95756adc2afbfb8b))
* Implements custom status effects ([8d204a5](https://github.com/valentine195/obsidian-initiative-tracker/commit/8d204a5caa9fa75b94ba20ce7c95c344096645e3))
* Players linked to notes will now update their hp, ac, modifier, and level ([648145c](https://github.com/valentine195/obsidian-initiative-tracker/commit/648145c45170dd81145a828fc2e0d27cbf55fd89))


### Bug Fixes

* fixes styling issues with settings tab ([44a7407](https://github.com/valentine195/obsidian-initiative-tracker/commit/44a7407d55afa669965fd62aaaab8a6538a8e59a))

## [7.1.0](https://github.com/valentine195/obsidian-initiative-tracker/compare/7.0.0...7.1.0) (2022-01-26)


### Features

* can now right click monsters for context menu ([1fef354](https://github.com/valentine195/obsidian-initiative-tracker/commit/1fef354ea08d1b35fae31d258690525ab31d793a))


### Bug Fixes

* fixes issue with deleting active monster not going to next ([8ee9d09](https://github.com/valentine195/obsidian-initiative-tracker/commit/8ee9d09fd0640dcc0ff9e5279e4d08a0e81e9b31))

## [7.0.0](https://github.com/valentine195/obsidian-initiative-tracker/compare/6.0.1...7.0.0) (2022-01-22)


### ⚠ BREAKING CHANGES

* removes homebrew monster support (homebrew is now managed solely by TTRPG statblocks)

### Features

* removes homebrew monster support (homebrew is now managed solely by TTRPG statblocks) ([6aded50](https://github.com/valentine195/obsidian-initiative-tracker/commit/6aded5072a1f712a97fbffb0957d2656d8bb2c77))


### Bug Fixes

* fixes issue where clicking a creature name will reset its name (close [#24](https://github.com/valentine195/obsidian-initiative-tracker/issues/24)) ([6c07566](https://github.com/valentine195/obsidian-initiative-tracker/commit/6c0756608d875926676e5f89605d48d637290d90))

### [6.0.1](https://github.com/valentine195/obsidian-initiative-tracker/compare/6.0.0...6.0.1) (2022-01-20)


### Bug Fixes

* removed console logs ([2b07d78](https://github.com/valentine195/obsidian-initiative-tracker/commit/2b07d78429ad637c2a4e3dce8f2df435e87a241a))

## [6.0.0](https://github.com/valentine195/obsidian-initiative-tracker/compare/5.3.1...6.0.0) (2022-01-20)


### ⚠ BREAKING CHANGES

* Removed homebrew creatures. Homebrew creatures are now manages solely through 5e Statblocks.

### Features

* Removed homebrew creatures. Homebrew creatures are now manages solely through 5e Statblocks. ([12c374b](https://github.com/valentine195/obsidian-initiative-tracker/commit/12c374bf9d1a04e4fa939a44e70044b5a51b0033))

### [5.3.1](https://github.com/valentine195/obsidian-initiative-tracker/compare/5.3.0...5.3.1) (2022-01-13)


### Bug Fixes

* remove logs ([76ded72](https://github.com/valentine195/obsidian-initiative-tracker/commit/76ded72198778b4daa0259123f06ff98faeb8f36))

## [5.3.0](https://github.com/valentine195/obsidian-initiative-tracker/compare/5.2.0...5.3.0) (2022-01-13)


### Features

* add encounter line post processor ([eb98ea9](https://github.com/valentine195/obsidian-initiative-tracker/commit/eb98ea90ad01838ba633a3c2e041320d2bcbda7a))
* add round number display to tracker (close [#23](https://github.com/valentine195/obsidian-initiative-tracker/issues/23)) ([59e13e5](https://github.com/valentine195/obsidian-initiative-tracker/commit/59e13e512ce32990327c7633157667a786e8b62c))


### Bug Fixes

* Update release notes message ([66c7ed3](https://github.com/valentine195/obsidian-initiative-tracker/commit/66c7ed361c6b0c12fd1ebd501b645d2c1a45cc2d))

## [5.2.0](https://github.com/valentine195/obsidian-initiative-tracker/compare/5.1.2...5.2.0) (2022-01-12)


### Features

* added encounter table postprocessor ([1cc96c9](https://github.com/valentine195/obsidian-initiative-tracker/commit/1cc96c92dd7e2509518193baba7c1425d8015777))

### [5.1.2](https://github.com/valentine195/obsidian-initiative-tracker/compare/5.1.1...5.1.2) (2021-12-23)


### Bug Fixes

* fixed issue with custom statuses breaking view loading ([0b5b95d](https://github.com/valentine195/obsidian-initiative-tracker/commit/0b5b95d62466497df5ee1a01d5bbabb2e02364df))

### [5.1.1](https://github.com/valentine195/obsidian-initiative-tracker/compare/5.1.0...5.1.1) (2021-12-22)


### Bug Fixes

* encounter name now clears on new encounter ([39889c4](https://github.com/valentine195/obsidian-initiative-tracker/commit/39889c46c10343fe6dbe332d6d851df273aa5a8f))

## [5.1.0](https://github.com/valentine195/obsidian-initiative-tracker/compare/5.0.3...5.1.0) (2021-12-22)


### Features

* can now save and load encounter states ([7085303](https://github.com/valentine195/obsidian-initiative-tracker/commit/708530342040ae1bf4be44276c483d4d5005e023))
* initiative tracker now displays creature count ([e73e9cd](https://github.com/valentine195/obsidian-initiative-tracker/commit/e73e9cd9edff5a8c5fcbfa2cb6be5134dafd1dfb))


### Bug Fixes

* clicking a creature name now opens the creature statblock ([31917c1](https://github.com/valentine195/obsidian-initiative-tracker/commit/31917c193e960d33c74a21125062bf642a170aeb))

### [5.0.3](https://github.com/valentine195/obsidian-initiative-tracker/compare/5.0.2...5.0.3) (2021-12-14)


### Bug Fixes

* removed logs ([a9fc9d2](https://github.com/valentine195/obsidian-initiative-tracker/commit/a9fc9d262e96f5809581858851ab6e5e01464c14))

### [5.0.2](https://github.com/valentine195/obsidian-initiative-tracker/compare/5.0.1...5.0.2) (2021-12-14)


### Bug Fixes

* added global condense setting in Settings ([56df12a](https://github.com/valentine195/obsidian-initiative-tracker/commit/56df12af7de3ba45ee16567d68c74a63d2497ef7))

### [5.0.1](https://github.com/valentine195/obsidian-initiative-tracker/compare/5.0.0...5.0.1) (2021-12-14)


### Bug Fixes

* update TTRPG statblocks name ([d7b098b](https://github.com/valentine195/obsidian-initiative-tracker/commit/d7b098b47e4a193755b03379c389bf4a30245831))

## [5.0.0](https://github.com/valentine195/obsidian-initiative-tracker/compare/4.0.1...5.0.0) (2021-12-14)


### Features

* add amounts of creatures ([9e8b304](https://github.com/valentine195/obsidian-initiative-tracker/commit/9e8b304a5e2eacacbe04a84106b8ea5f26aa2e8b))
* Added ability to view creature ([110ed81](https://github.com/valentine195/obsidian-initiative-tracker/commit/110ed815e61dc7b735a4ca61a4fe40684cc6f042))
* added dice rollable monsters in encounter block (requires dice roller plugin) ([bfba23f](https://github.com/valentine195/obsidian-initiative-tracker/commit/bfba23fd8040c8f8e7bd097042deda5b1f16f5e0))
* Monsters can now be drag-and-dropped to change initiative order ([5af7f4f](https://github.com/valentine195/obsidian-initiative-tracker/commit/5af7f4f8af54727af1a7468e8799d21d0171dcd0))
* Monsters can now roll initiatives together ([79a9a86](https://github.com/valentine195/obsidian-initiative-tracker/commit/79a9a86139c477bd5eb684bfedc8a19664d379b3))
