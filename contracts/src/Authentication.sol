// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "./Verifier.sol";

contract Authentication is Verifier {

    mapping(address => bytes32) public nullifiers;
    bytes public hashedSecret;

    constructor(bytes memory _hashedSecret) {
        hashedSecret = _hashedSecret;
    }

    function authenticate(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[3] memory input
    ) external returns (bool result) {
        uint nullifier = input[2];
        require(nullifiers[msg.sender] != bytes32(nullifier), "Already authenticated");
        nullifiers[msg.sender] = bytes32(nullifier);
        result = verifyProof(a, b, c, input);
    }
}