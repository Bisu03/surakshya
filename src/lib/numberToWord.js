export function amountToWords(amount) {
    if (amount === null || isNaN(amount)) {
        return 'Zero rupees';
    }

    const num = parseFloat(amount);
    if (isNaN(num)) {
        return 'Zero rupees';
    }

    const numStr = num.toFixed(2);
    const [integerPartStr, decimalPartStr] = numStr.split('.');
    const integerPart = parseInt(integerPartStr, 10);
    const decimalPart = parseInt(decimalPartStr, 10);

    const rupees = convertIntegerToWords(integerPart);
    const paisa = convertTwoDigits(decimalPart);

    const result = [];
    let formattedRupees = '';
    let formattedPaisa = '';

    if (integerPart !== 0) {
        formattedRupees = `${rupees.charAt(0).toUpperCase() + rupees.slice(1)} rupees`;
        result.push(formattedRupees);
    }
    if (decimalPart !== 0) {
        formattedPaisa = `${paisa.charAt(0).toUpperCase() + paisa.slice(1)} paisa`;
        result.push(formattedPaisa);
    }

    if (result.length === 0) return 'Zero rupees';
    return result.join(' and ');
}

function convertIntegerToWords(n) {
    if (n === 0) return 'zero';

    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    const hundred = n;

    const parts = [];
    if (crore > 0) parts.push(`${convertThreeDigits(crore)} crore`);
    if (lakh > 0) parts.push(`${convertTwoDigits(lakh)} lakh`);
    if (thousand > 0) parts.push(`${convertTwoDigits(thousand)} thousand`);
    if (hundred > 0) parts.push(convertThreeDigits(hundred));

    return parts.join(' ').trim();
}

const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function convertTwoDigits(n) {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
}

function convertThreeDigits(n) {
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    const parts = [];
    if (hundred > 0) parts.push(`${ones[hundred]} hundred`);
    if (remainder > 0) parts.push(convertTwoDigits(remainder));
    return parts.join(' ');
}