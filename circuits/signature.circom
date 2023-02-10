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

template GroupSign(n) {
    signal input sk;
    signal input pk[n]; // indicate all the public keys in the group
    signal input m;

    // get the corresponding public key to the secret key
    component computePk = SecretToPublic();
    computePk.sk <== sk;

    // make sure that computePk.pk exists in the pk array
    signal zeroChecker[n+1];
    zeroChecker[0] <== 1;
    for (var i = 0; i < n; i++) {
        zeroChecker[i+1] <== zeroChecker[i] * (pk[i] - computePk.pk);
    }
    // at some point in the for loop, if pk[i] is equal to computePk.pk
    // zeroChecker[i+1] will become zero
    zeroChecker[n] === 0;
}

// the proof itself is the signature
// because the prover has access to the correct secret key
component main { public [m, pk] } = GroupSign(5);
