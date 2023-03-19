import { builder } from './witness_calculator'
import { groth16 } from 'snarkjs'

const zkeyPath = 'authentication__prod.0.zkey'
const wasmPath = 'authentication__prod.wasm'

const calculateProof = async (
    address,
    secret,
) => {
    alert("Testing!")
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