const fs = require('fs');
const circomlib = require('circomlibjs');
const ff = require('ffjavascript');
const { callGenWitness, callGetSignalByName } = require('circom-helper');

describe('Authentication test', () => {
    const circuit = 'authentication';
    let poseidon;

    beforeAll(async () => {
        poseidon = await circomlib.buildPoseidon();
    });

    it("Should produce a witness and the correct nullifier", async () => {
        const preimage = BigInt(1234);

        // Hash the preimage
        const hash = poseidon([preimage]);
        const address = BigInt('0x1111111111111111111111111111111111111111'); // random address

        // Construct the circut inputs
        const circuitInputs = ff.utils.stringifyBigInts({
            // Converts the buffer to a BigInt
            secret: preimage,
            hashedSecret: poseidon.F.toObject(hash),
            address: address,
        })

        console.log("Circuit inputs: ", circuitInputs);

        // Generate the witness
        const witness = await callGenWitness(circuit, circuitInputs)

        console.log("Witness: ", witness);

        // Get the nullifier from the witness
        const nullifier = await callGetSignalByName(circuit, witness, 'main.nullifier')

        console.log("Nullifier: ", nullifier.toString());

        // Check that the nullifier is correct
        const expectedNullifier = poseidon.F.toObject(
            poseidon([address, preimage]),
        )
        expect(nullifier.toString()).toEqual(expectedNullifier.toString())
    })
})