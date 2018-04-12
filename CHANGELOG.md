# CHANGELOG - throttle

## 0.3.0 2018-04-12

### Fixed
* Ensure setup has completed fully before returning when starting throttling with tc.
* Always return Promises from start() and stop(), even in case of errors.
* Typo in the CLI help
* Simpler way to set connectivity with tc

## 0.2.0 2017-10-31

### Added 
* You can now see the version with --version
* You can now use pre defined profiles.

## 0.1.0 2017-10-13

### Fixed
* Always remove filters before we try to set them.