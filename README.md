# learning-zk

### Getting started 

Prerequisite is to have `circom` installed in your local machine. Then, run `npm install`.

### Running tests

Open up two terminals. In the first terminal, run
```
npm run circom-helper
```
In the second terminal, run
```
npm run test
```

### Generate zkey file

Modify the `circuits` configuration in the `zkeys.config.yml` file. Make sure that `main` is not defined in the specified circom file. Then run the following: 
1. `npm run zkey-manager-compile`
2. `npm run zkey-manager-downloadPtau`
3. `npm run zkey-manager-genZkeys`

This will generate a `zkeys` folder which contains the corresponding zkey files.