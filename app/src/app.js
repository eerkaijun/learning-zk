const builder = require('./witness_calculator');
const snarkjs = require('snarkjs');
const ethers = require('ethers');

const zkeyPath = 'http://127.0.0.1:8000/authentication__prod.0.zkey'
const wasmPath = 'http://127.0.0.1:8000/authentication__prod.wasm'

const calculateProof = async (
    address,
    secret
) => {
    // construct the circuit inputs
    const circuitInputs = {
        hashedSecret: BigInt('1121645852825515626345503741442177404306361956507933536148868635850297893661'),
        address: BigInt(address),
        secret: BigInt(secret),
    }

    // Fetch the zkey and wasm files, and convert them into array buffers
    let resp = await fetch(wasmPath)
    const wasmBuff = await resp.arrayBuffer()
    resp = await fetch(zkeyPath)
    const zkeyBuff = await resp.arrayBuffer()

    console.log('wasmBuff', wasmBuff)
    console.log('zkeyBuff', zkeyBuff)

    // Calculate the witness
    const witnessCalculator = await builder(wasmBuff)
    const wtnsBuff = await witnessCalculator.calculateWTNSBin(circuitInputs, 0)
    console.log('wtnsBuff', wtnsBuff)

    const start = Date.now()
    const { proof, publicSignals } =
        await snarkjs.groth16.prove(new Uint8Array(zkeyBuff), wtnsBuff, null)
    const end = Date.now()
    const timeTaken = ((end - start) / 1000).toString() + ' seconds'
    const timeComponent = document.getElementById('time')
    timeComponent.innerHTML = timeTaken

    const nullifier = document.getElementById("nullifier")
    nullifier.innerHTML = BigInt(publicSignals[2]).toString()

    // Verify the proof from the smart contract
    const provider = await ethers.getDefaultProvider("goerli")
    const contractABI = [
        {
          "inputs": [
            {
              "internalType": "uint256[2]",
              "name": "a",
              "type": "uint256[2]"
            },
            {
              "internalType": "uint256[2][2]",
              "name": "b",
              "type": "uint256[2][2]"
            },
            {
              "internalType": "uint256[2]",
              "name": "c",
              "type": "uint256[2]"
            },
            {
              "internalType": "uint256[3]",
              "name": "input",
              "type": "uint256[3]"
            }
          ],
          "name": "verifyProof",
          "outputs": [
            {
              "internalType": "bool",
              "name": "r",
              "type": "bool"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        }
    ]
    const verifier = new ethers.Contract(
        "0x5Bc073B57038086BF294DC9594D9857247506D7C",
        contractABI,
        provider
    )

    const result = await verifier.verifyProof(
        proof.pi_a.slice(0, 2),
        proof.pi_b.slice(0, 2),
        proof.pi_c.slice(0, 2),
        publicSignals
    )
    console.log("Verification result: ", result)
}

const main = async () => {
    const bGenProof = document.getElementById("bGenProof")

    bGenProof.addEventListener("click", () => {
        const secret = document.getElementById("secret")
        const address = document.getElementById("address")
        calculateProof(
            address.value,
            secret.value
        )
    })
}

main()