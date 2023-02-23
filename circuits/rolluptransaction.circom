pragma circom 2.1.2;
include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/eddsaposeidon.circom";
include "./lib/merkleconstruction.circom";
include "./lib/poseidonwrapper.circom";

template VerifyEdDSAPoseidon(k) {
    signal input from_x;
    signal input from_y;
    signal input R8x;
    signal input R8y;
    signal input S;
    signal input leaf[k];
    
    // Hash leaf using poseidon hasher
    component hasher = Poseidon(k);
    for (var i = 0; i < k; i ++) {
        hasher.inputs[i] <== leaf[i];
    }
    signal M <== hasher.out;
    
    // Add inputs to verifier
    component verifier = EdDSAPoseidonVerifier();
    verifier.enabled <== 1;
    verifier.Ax <== from_x;
    verifier.Ay <== from_y;
    verifier.R8x <== R8x;
    verifier.R8y <== R8y;
    verifier.S <== S;
    verifier.M <== M;
}

// k is depth of accounts tree
template ProcessTx(k){

    // accounts tree info
    signal input accounts_root;
    signal input intermediate_root;
    signal input accounts_pubkeys[2**k][2];
    signal input accounts_balances[2**k];

    // transactions info
    signal input sender_pubkey[2];
    signal input sender_balance;
    signal input receiver_pubkey[2];
    signal input receiver_balance;
    signal input amount;
    signal input signature_R8x;
    signal input signature_R8y;
    signal input signature_S;
    signal input sender_proof[k];
    signal input sender_proof_pos[k];
    signal input receiver_proof[k];
    signal input receiver_proof_pos[k];

    signal output new_accounts_root;

    // verify sender account exists in accounts_root
    component senderExistence = GetMerkleRoot(k, 3);
    senderExistence.leaf[0] <== sender_pubkey[0];
    senderExistence.leaf[1] <== sender_pubkey[1];
    senderExistence.leaf[2] <== sender_balance;
    for (var i = 0; i < k; i++) {
        senderExistence.pathElements[i] <== sender_proof[i];
        senderExistence.pathIndices[i] <== sender_proof_pos[i];
    }
    senderExistence.out === accounts_root;

    // check that transaction was signed by sender
    component signatureCheck = VerifyEdDSAPoseidon(5);
    signatureCheck.leaf[0] <== sender_pubkey[0];
    signatureCheck.leaf[1] <== sender_pubkey[1];
    signatureCheck.leaf[2] <== receiver_pubkey[0];
    signatureCheck.leaf[3] <== receiver_pubkey[1];
    signatureCheck.leaf[4] <== amount;
    signatureCheck.from_x <== sender_pubkey[0];
    signatureCheck.from_y <== sender_pubkey[1];
    signatureCheck.R8x <== signature_R8x;
    signatureCheck.R8y <== signature_R8y;
    signatureCheck.S <== signature_S;

    // debit sender account and hash new sender leaf
    component newSenderLeaf = Poseidon(3);
    newSenderLeaf.inputs[0] <== sender_pubkey[0];
    newSenderLeaf.inputs[1] <== sender_pubkey[1];
    newSenderLeaf.inputs[2] <== sender_balance - amount;
    signal new_sender_leaf;
    new_sender_leaf <== newSenderLeaf.out;

    // check intermediate tree with new sender balance
    component intermediate_tree = GetMerkleRoot(k, 3);
    intermediate_tree.leaf[0] <== sender_pubkey[0];
    intermediate_tree.leaf[1] <== sender_pubkey[1];
    intermediate_tree.leaf[2] <== sender_balance - amount;
    for (var i = 0; i < k; i++) {
        intermediate_tree.pathElements[i] <== sender_proof[i];
        intermediate_tree.pathIndices[i] <== sender_proof_pos[i];
    }
    intermediate_tree.out === intermediate_root;

    // verify receiver account exists in intermediate_root
    component receiverExistence = GetMerkleRoot(k, 3);
    receiverExistence.leaf[0] <== receiver_pubkey[0];
    receiverExistence.leaf[1] <== receiver_pubkey[1];
    receiverExistence.leaf[2] <== receiver_balance;
    for (var i = 0; i < k; i++) {
        receiverExistence.pathElements[i] <== receiver_proof[i];
        receiverExistence.pathIndices[i] <== receiver_proof_pos[i];
    }
    receiverExistence.out === intermediate_root;

    // credit receiver account and hash new receiver leaf
    component newReceiverLeaf = Poseidon(3);
    newReceiverLeaf.inputs[0] <== receiver_pubkey[0];
    newReceiverLeaf.inputs[1] <== receiver_pubkey[1];
    newReceiverLeaf.inputs[2] <== receiver_balance + amount;
    signal new_receiver_leaf;
    new_receiver_leaf <== newReceiverLeaf.out;

    // output final accounts_root
    component updated_tree = GetMerkleRoot(k, 3);
    updated_tree.leaf[0] <== receiver_pubkey[0];
    updated_tree.leaf[1] <== receiver_pubkey[1];
    updated_tree.leaf[2] <== receiver_balance + amount;
    for (var i = 0; i < k; i++) {
        updated_tree.pathElements[i] <== receiver_proof[i];
        updated_tree.pathIndices[i] <== receiver_proof_pos[i];
    }
    new_accounts_root <== updated_tree.out;
}

component main{public [accounts_root]} = ProcessTx(1);
