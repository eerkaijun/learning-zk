pragma circom 2.1.2;

include "../node_modules/circomlib/circuits/poseidon.circom";

template authentication() {
    // prove that the user has the secret which gains access to the system
    // without revealing the secret

    signal input secret;
    signal input hashedSecret;
    signal input address; // the address of the user
    signal output nullifier;

    // constraint that the user knows the correct secret
    component poseidon = Poseidon(1);
    poseidon.inputs[0] <== secret;
    poseidon.out === hashedSecret;

    // constraint that the nullifier is the hash of the address and the secret
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== address;
    nullifierHasher.inputs[1] <== secret;
    nullifier <== nullifierHasher.out;
}

component main { public [hashedSecret, address] } = authentication();