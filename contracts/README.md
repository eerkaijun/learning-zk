# On-chain Smart Contract Verification

We verify the ZK proof on-chain. To deploy the verifier contract, run the following: 
```shell
forge create --rpc-url <rpc_url> --private-key <private_key> src/Verifier.sol:Verifier
```

An instance of the verifier contract has been deployed to: `0x5Bc073B57038086BF294DC9594D9857247506D7C`.