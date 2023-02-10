pragma circom 2.1.2;

include "../node_modules/circomlib/circuits/poseidon.circom";

template SecretToPublic() {
    signal input sk;
    signal output pk;

    component poseidon = Poseidon(1);
    poseidon.inputs[0] <== sk;
    pk <== poseidon.out;
}

template Sign() {
    signal input m;
    signal input sk;
    signal input pk;

    // verify that prover has the corresponding secret key to the public key
    component checker = SecretToPublic();
    checker.sk <== sk;
    pk === checker.pk;

    // dummy constraints
    signal mSquared;
    mSquared <== m * m;
}

// the proof itself is the signature
// because the prover has access to the correct secret key
component main { public [m, pk] } = Sign();
