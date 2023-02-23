const circomlib = require('circomlibjs');
const ff = require('ffjavascript');
const { callGenWitness, callGetSignalByName } = require('circom-helper');

describe("Rollup Transaction Test", () => {
    const circuit = 'rolluptransaction';
    let poseidon, eddsa;

    beforeAll(async () => {
        poseidon = await circomlib.buildPoseidon();
        eddsa = await circomlib.buildEddsa();
    });

    it("Should correctly process a single transaction", async () => {
        const alicePrvKey = Buffer.from("1".toString().padStart(64, "0"), "hex");
        const alicePubKey = eddsa.prv2pub(alicePrvKey);
        const bobPrvKey = Buffer.from("2".toString().padStart(64, "0"), "hex");
        const bobPubKey = eddsa.prv2pub(bobPrvKey);

        // accounts
        const Alice = {
            pubkey: alicePubKey,
            balance: 500,
        };
        const aliceHash = await poseidon([Alice.pubkey[0], Alice.pubkey[1], Alice.balance]);

        const Bob = {
            pubkey: bobPubKey,
            balance: 0,
        };
        const bobHash = await poseidon([Bob.pubkey[0], Bob.pubkey[1], Bob.balance]);

        // construct merkle tree
        const leafArray = [aliceHash, bobHash];
        const merkleRoot = await poseidon(leafArray);

        // transaction
        const tx = {
            from: Alice.pubkey,
            to: Bob.pubkey,
            amount: 500,
        };

        // Alice sign tx
        const txHash = await poseidon([
            tx.from[0],
            tx.from[1],
            tx.to[0],
            tx.to[1],
            tx.amount,
        ]);
        const signature = eddsa.signPoseidon(alicePrvKey, txHash);

        // update Alice account
        const newAlice = {
            pubkey: alicePubKey,
            balance: 0,
        };
        const newAliceHash = await poseidon([
            newAlice.pubkey[0],
            newAlice.pubkey[1],
            newAlice.balance,
        ]);

        // update intermediate root
        const intermediateRoot = await poseidon([newAliceHash, bobHash]);

        // update Bob account
        const newBob = {
            pubkey: bobPubKey,
            balance: 500,
        };
        const newBobHash = await poseidon([
            newBob.pubkey[0],
            newBob.pubkey[1],
            newBob.balance,
        ]);

        // update final root
        const finalRoot = await poseidon([newAliceHash, newBobHash]);

        // construct circuit inputs
        const circuitInputs = ff.utils.stringifyBigInts({
            accounts_root: poseidon.F.toObject(merkleRoot),
            intermediate_root: poseidon.F.toObject(intermediateRoot),
            accounts_pubkeys: [
                [eddsa.F.toObject(Alice.pubkey[0]), eddsa.F.toObject(Alice.pubkey[1])],
                [eddsa.F.toObject(Bob.pubkey[0]), eddsa.F.toObject(Bob.pubkey[1])],
            ],
            accounts_balances: [Alice.balance, Bob.balance],
            sender_pubkey: [eddsa.F.toObject(Alice.pubkey[0]), eddsa.F.toObject(Alice.pubkey[1])],
            sender_balance: Alice.balance,
            receiver_pubkey: [eddsa.F.toObject(Bob.pubkey[0]), eddsa.F.toObject(Bob.pubkey[1])],
            receiver_balance: Bob.balance,
            amount: tx.amount,
            signature_R8x: eddsa.F.toObject(signature["R8"][0]),
            signature_R8y: eddsa.F.toObject(signature["R8"][1]),
            signature_S: signature["S"].toString(),
            sender_proof: [poseidon.F.toObject(bobHash)],
            sender_proof_pos: [0],
            receiver_proof: [poseidon.F.toObject(newAliceHash)],
            receiver_proof_pos: [1],
        });

        // Generate the witness
        const witness = await callGenWitness(circuit, circuitInputs);

        // Get the new merkle root from the witness
        const newMerkleRoot = await callGetSignalByName(circuit, witness, 'main.new_accounts_root');

        // Assertion
        const expectedRoot = poseidon.F.toObject(finalRoot);
        expect(newMerkleRoot.toString()).toEqual(expectedRoot.toString());
    });
})