const circomlib = require('circomlibjs');
const ff = require('ffjavascript');
const { callGenWitness } = require('circom-helper');

describe("Merkle Tree Inclusion Test", () => {
    const circuit = 'merkleinclusion';
    let poseidon;
    let leaf1, leaf2, leaf3, leaf4;
    let hash1, hash2, root;

    beforeAll(async () => {
        poseidon = await circomlib.buildPoseidon();

        // a two levels merkle tree
        leaf1 = BigInt(1);
        leaf2 = BigInt(2);
        leaf3 = BigInt(3);
        leaf4 = BigInt(4);

        // second level hashes
        hash1 = poseidon([leaf1, leaf2]);
        hash2 = poseidon([leaf3, leaf4]);

        // root hash
        root = poseidon([hash1, hash2]);
    });

    it("Should correctly verify that a leaf is in a merkle tree", async () => {
        // construct the circuit inputs
        const pathIndices = [BigInt(0), BigInt(0)];
        const pathElements = [leaf2, poseidon.F.toObject(hash2)];
        const circuitInputs = ff.utils.stringifyBigInts({
            root: poseidon.F.toObject(root),
            siblings: pathElements,
            pathIndices: pathIndices,
            leaf: leaf1
        });

        // Generate the witness
        expect(await callGenWitness(circuit, circuitInputs)).toBeDefined();
    })

    it("Should throw an error if a wrong leaf is provided", async () => {
        // construct the circuit inputs
        const wrongLeaf = BigInt(5);
        const pathIndices = [BigInt(0), BigInt(0)];
        const pathElements = [leaf2, poseidon.F.toObject(hash2)];
        const circuitInputs = ff.utils.stringifyBigInts({
            root: poseidon.F.toObject(root),
            siblings: pathElements,
            pathIndices: pathIndices,
            leaf: wrongLeaf
        });

        // Generate the witness
        let error = false;
        try {
            await callGenWitness(circuit, circuitInputs);
        } catch (e) {
            error = true;
        }

        // assert that an error was thrown
        expect(error).toEqual(true);
    })
})