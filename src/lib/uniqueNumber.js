const generatedNumbers = new Set();

export function generateUnique() {
    if (generatedNumbers.size >= 9000) {
        throw new Error("All possible numbers are exhausted!");
    }

    let randomNumber;
    do {
        randomNumber = Math.floor(1000 + Math.random() * 9000);
    } while (generatedNumbers.has(randomNumber));

    generatedNumbers.add(randomNumber);
    return randomNumber;
}

