// He thong Quay Check-in San bay - Quan ly Ve may bay & Hanh ly ky gui
//
// CACH CHAY
//  - Console trinh duyet: dan toan bo file vao tab Console (F12) roi Enter.
//    Chuong trinh dung hop thoai prompt() cua trinh duyet de nhap lieu.
//  - Node.js: npm install prompt-sync   roi   node capstone_flight_checkin.js

// ======================================================================
// 0. NHAP LIEU (tu nhan dien moi truong)
// ======================================================================
let readLine;
if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
  readLine = function (question) {
    return window.prompt(question);
  };
} else {
  const promptSync = require('prompt-sync')({ sigint: true });
  readLine = function (question) {
    return promptSync(question);
  };
}

// Doc 1 dong va cat khoang trang; neu nguoi dung bam Cancel thi tra ve ''
function ask(question) {
  const answer = readLine(question);
  if (answer === null || answer === undefined) {
    return '';
  }
  return String(answer).trim();
}

// ======================================================================
// 1. HANG SO & DU LIEU
// ======================================================================
const SEAT_CLASS_ECONOMY = 'ECONOMY';
const SEAT_CLASS_BUSINESS = 'BUSINESS';

const FREE_BAGGAGE_ECONOMY_KG = 20;
const FREE_BAGGAGE_BUSINESS_KG = 30;
const EXCESS_FEE_PER_KG = 50000; // VND / kg

const STATUS_BOOKED = 'BOOKED';
const STATUS_CHECKED_IN = 'CHECKED_IN';
const STATUS_CANCELLED = 'CANCELLED';

const PNR_LENGTH = 6;

const tickets = [
  { pnr: 'ABC123', passengerName: 'Nguyen Van An', flightCode: 'VN210', route: 'HAN - SGN', departure: '08:30', gate: 'A12', seatClass: SEAT_CLASS_ECONOMY, seat: '23C', status: STATUS_BOOKED, baggageKg: 0, excessFee: 0 },
  { pnr: 'XYZ789', passengerName: 'Tran Thi Mai', flightCode: 'VN210', route: 'HAN - SGN', departure: '08:30', gate: 'A12', seatClass: SEAT_CLASS_BUSINESS, seat: '02A', status: STATUS_BOOKED, baggageKg: 0, excessFee: 0 },
  { pnr: 'QWE456', passengerName: 'Le Hoang Nam', flightCode: 'VN210', route: 'HAN - SGN', departure: '08:30', gate: 'A12', seatClass: SEAT_CLASS_ECONOMY, seat: '15F', status: STATUS_CHECKED_IN, baggageKg: 18, excessFee: 0 },
  { pnr: 'HN2105', passengerName: 'Pham Thu Ha', flightCode: 'VN210', route: 'HAN - SGN', departure: '08:30', gate: 'A12', seatClass: SEAT_CLASS_ECONOMY, seat: '30B', status: STATUS_CANCELLED, baggageKg: 0, excessFee: 0 },
  { pnr: 'VN2100', passengerName: 'Vo Minh Quan', flightCode: 'VN210', route: 'HAN - SGN', departure: '08:30', gate: 'A12', seatClass: SEAT_CLASS_BUSINESS, seat: '03D', status: STATUS_BOOKED, baggageKg: 0, excessFee: 0 }
];

// ======================================================================
// 2. HAM NGHIEP VU (khong nhap/xuat console)
// ======================================================================

// PNR hop le: du 6 ky tu, chi gom chu cai A-Z va chu so 0-9 (da chuan hoa in hoa)
function isValidPnr(pnr) {
  if (pnr.length !== PNR_LENGTH) {
    return false;
  }
  for (let i = 0; i < pnr.length; i++) {
    const ch = pnr.charAt(i);
    const isLetter = ch >= 'A' && ch <= 'Z';
    const isDigit = ch >= '0' && ch <= '9';
    if (!isLetter && !isDigit) {
      return false;
    }
  }
  return true;
}

// Can nang hop le: la so huu han va khong am
function isValidWeight(weightKg) {
  return typeof weightKg === 'number' && isFinite(weightKg) && weightKg >= 0;
}

function findTicketByPnr(list, pnr) {
  for (let i = 0; i < list.length; i++) {
    if (list[i].pnr === pnr) {
      return list[i];
    }
  }
  return null;
}

// Tim theo ma PNR (chinh xac) hoac ten hanh khach (chua tu khoa, khong phan biet hoa thuong)
function searchTickets(list, keyword) {
  const lowerKeyword = keyword.toLowerCase();
  const matches = [];
  for (let i = 0; i < list.length; i++) {
    const pnrMatched = list[i].pnr.toLowerCase() === lowerKeyword;
    const nameMatched = list[i].passengerName.toLowerCase().includes(lowerKeyword);
    if (pnrMatched || nameMatched) {
      matches.push(list[i]);
    }
  }
  return matches;
}

function getFreeBaggageAllowance(seatClass) {
  if (seatClass === SEAT_CLASS_BUSINESS) {
    return FREE_BAGGAGE_BUSINESS_KG;
  }
  return FREE_BAGGAGE_ECONOMY_KG;
}

// Phi qua can = so kg vuot dinh muc x 50.000 VND (khong vuot thi bang 0)
function calculateExcessBaggageFee(seatClass, weightKg) {
  const excessKg = weightKg - getFreeBaggageAllowance(seatClass);
  if (excessKg <= 0) {
    return 0;
  }
  return excessKg * EXCESS_FEE_PER_KG;
}

// BOOKED -> CHECKED_IN: ghi can nang hanh ly va phu thu
function checkIn(list, pnr, weightKg) {
  const ticket = findTicketByPnr(list, pnr);
  if (ticket === null) {
    return { success: false, message: 'Khong tim thay ve voi ma PNR ' + pnr + '!', ticket: null };
  }
  if (ticket.status === STATUS_CANCELLED) {
    return { success: false, message: 'Ve ' + pnr + ' da bi HUY, khong the check-in!', ticket: ticket };
  }
  if (ticket.status === STATUS_CHECKED_IN) {
    return { success: false, message: 'Ve ' + pnr + ' da check-in truoc do!', ticket: ticket };
  }
  if (!isValidWeight(weightKg)) {
    return { success: false, message: 'Can nang hanh ly phai la so khong am!', ticket: ticket };
  }

  ticket.baggageKg = weightKg;
  ticket.excessFee = calculateExcessBaggageFee(ticket.seatClass, weightKg);
  ticket.status = STATUS_CHECKED_IN;
  return { success: true, message: 'Check-in thanh cong cho ' + ticket.passengerName + '.', ticket: ticket };
}

// BOOKED / CHECKED_IN -> CANCELLED
function cancelTicket(list, pnr) {
  const ticket = findTicketByPnr(list, pnr);
  if (ticket === null) {
    return { success: false, message: 'Khong tim thay ve voi ma PNR ' + pnr + '!' };
  }
  if (ticket.status === STATUS_CANCELLED) {
    return { success: false, message: 'Ve ' + pnr + ' da bi huy tu truoc!' };
  }

  const wasCheckedIn = ticket.status === STATUS_CHECKED_IN;
  ticket.status = STATUS_CANCELLED;
  if (wasCheckedIn) {
    return { success: true, message: 'Da huy ve ' + pnr + '. Luu y: khach da check-in, can rut hanh ly ky gui khoi may bay!' };
  }
  return { success: true, message: 'Da huy ve ' + pnr + '.' };
}

// ======================================================================
// 3. HAM HIEN THI
// ======================================================================
function formatMoney(amount) {
  const digits = String(amount);
  let result = '';
  let counter = 0;
  for (let i = digits.length - 1; i >= 0; i--) {
    result = digits[i] + result;
    counter++;
    if (counter % 3 === 0 && i > 0) {
      result = '.' + result;
    }
  }
  return result + ' VND';
}

function printMessage(result) {
  if (result.success) {
    console.log('[OK] ' + result.message);
  } else {
    console.log('[LOI] ' + result.message);
  }
}

function displayMenu() {
  console.log('\n==================================================');
  console.log('   QUAY CHECK-IN - CHUYEN BAY VN210 (HAN - SGN)');
  console.log('==================================================');
  console.log('1. Xem danh sach ve chuyen bay');
  console.log('2. Check-in, can hanh ly va tinh phu thu');
  console.log('3. Tra cuu ve (ma PNR hoac ten khach)');
  console.log('4. Huy ve');
  console.log('5. Thoat chuong trinh');
  console.log('--------------------------------------------------');
}

function printTableLine() {
  console.log('+--------+----------------------+---------+----------+------+------------+----------+');
}

function printTicketTable(list) {
  printTableLine();
  console.log(
    '| ' + 'PNR'.padEnd(6) +
    ' | ' + 'Hanh khach'.padEnd(20) +
    ' | ' + 'Chuyen'.padEnd(7) +
    ' | ' + 'Hang ve'.padEnd(8) +
    ' | ' + 'Ghe'.padEnd(4) +
    ' | ' + 'Trang thai'.padEnd(10) +
    ' | ' + 'Hanh ly'.padEnd(8) + ' |'
  );
  printTableLine();
  for (let i = 0; i < list.length; i++) {
    const t = list[i];
    console.log(
      '| ' + t.pnr.padEnd(6) +
      ' | ' + t.passengerName.padEnd(20) +
      ' | ' + t.flightCode.padEnd(7) +
      ' | ' + t.seatClass.padEnd(8) +
      ' | ' + t.seat.padEnd(4) +
      ' | ' + t.status.padEnd(10) +
      ' | ' + (t.baggageKg + ' kg').padEnd(8) + ' |'
    );
  }
  printTableLine();
}

function listTickets(list) {
  console.log('\n--- DANH SACH VE CHUYEN BAY ---');
  if (list.length === 0) {
    console.log('Chua co ve nao.');
    return;
  }
  printTicketTable(list);
  console.log('Tong so ve: ' + list.length);
}

function displayBoardingPass(ticket) {
  const line = '+------------------------------------------------+';
  console.log('\n' + line);
  console.log('|              THE LEN MAY BAY (BOARDING PASS)   |');
  console.log(line);
  console.log('| ' + ('Hanh khach : ' + ticket.passengerName).padEnd(46) + ' |');
  console.log('| ' + ('Ma PNR     : ' + ticket.pnr).padEnd(46) + ' |');
  console.log('| ' + ('Chuyen bay : ' + ticket.flightCode + '  (' + ticket.route + ')').padEnd(46) + ' |');
  console.log('| ' + ('Gio khoi hanh: ' + ticket.departure + '   Cong: ' + ticket.gate).padEnd(46) + ' |');
  console.log('| ' + ('Hang ve    : ' + ticket.seatClass + '   Ghe: ' + ticket.seat).padEnd(46) + ' |');
  console.log('| ' + ('Hanh ly KG : ' + ticket.baggageKg + ' kg (mien cuoc ' + getFreeBaggageAllowance(ticket.seatClass) + ' kg)').padEnd(46) + ' |');
  console.log('| ' + ('Phu thu    : ' + formatMoney(ticket.excessFee)).padEnd(46) + ' |');
  console.log('| ' + ('Trang thai : ' + ticket.status).padEnd(46) + ' |');
  console.log(line);
}

// ======================================================================
// 4. HAM XU LY LUA CHON MENU (nhap lieu -> kiem tra -> goi nghiep vu -> in ket qua)
// ======================================================================
function handleCheckIn() {
  console.log('\n--- CHECK-IN & CAN HANH LY ---');
  const pnr = ask('Nhap ma PNR (6 ky tu): ').toUpperCase();
  if (!isValidPnr(pnr)) {
    console.log('[LOI] Ma PNR khong hop le (can dung 6 ky tu gom chu cai va chu so)!');
    return;
  }

  const ticket = findTicketByPnr(tickets, pnr);
  if (ticket === null) {
    console.log('[LOI] Khong tim thay ve voi ma PNR ' + pnr + '!');
    return;
  }
  console.log('Hanh khach: ' + ticket.passengerName + ' | Hang ve: ' + ticket.seatClass +
    ' | Mien cuoc: ' + getFreeBaggageAllowance(ticket.seatClass) + ' kg');

  const weightText = ask('Nhap can nang hanh ly ky gui (kg): ');
  if (weightText === '') {
    console.log('[LOI] Can nang khong duoc de trong!');
    return;
  }

  const result = checkIn(tickets, pnr, Number(weightText));
  printMessage(result);
  if (result.success) {
    if (result.ticket.excessFee > 0) {
      console.log('[PHU THU] Hanh ly qua can, phi phai thu: ' + formatMoney(result.ticket.excessFee));
    }
    displayBoardingPass(result.ticket);
  }
}

function handleSearch() {
  console.log('\n--- TRA CUU VE ---');
  const keyword = ask('Nhap ma PNR hoac ten hanh khach: ');
  if (keyword === '') {
    console.log('[LOI] Tu khoa tim kiem khong duoc de trong!');
    return;
  }
  const matches = searchTickets(tickets, keyword);
  if (matches.length === 0) {
    console.log('[LOI] Khong tim thay ve nao khop voi "' + keyword + '".');
    return;
  }
  console.log('Tim thay ' + matches.length + ' ve:');
  printTicketTable(matches);
}

function handleCancel() {
  console.log('\n--- HUY VE ---');
  const pnr = ask('Nhap ma PNR can huy: ').toUpperCase();
  if (!isValidPnr(pnr)) {
    console.log('[LOI] Ma PNR khong hop le (can dung 6 ky tu gom chu cai va chu so)!');
    return;
  }
  if (findTicketByPnr(tickets, pnr) === null) {
    console.log('[LOI] Khong tim thay ve voi ma PNR ' + pnr + '!');
    return;
  }

  const confirmCancel = ask('Xac nhan huy ve ' + pnr + '? (y/n): ').toLowerCase();
  if (confirmCancel !== 'y') {
    console.log('Da bo qua thao tac huy ve.');
    return;
  }
  printMessage(cancelTicket(tickets, pnr));
}

// ======================================================================
// 5. CHUONG TRINH CHINH
// ======================================================================
function main() {
  let menuChoice;
  do {
    displayMenu();
    const rawChoice = readLine('Nhap lua chon (1-5): ');
    if (rawChoice === null || rawChoice === undefined) {
      menuChoice = '5'; // Bam Cancel o menu chinh = thoat ca lam viec
    } else {
      menuChoice = String(rawChoice).trim();
    }

    switch (menuChoice) {
      case '1':
        listTickets(tickets);
        break;
      case '2':
        handleCheckIn();
        break;
      case '3':
        handleSearch();
        break;
      case '4':
        handleCancel();
        break;
      case '5':
        console.log('Ket thuc ca lam viec. Chuc chuyen bay an toan!');
        break;
      default:
        console.log('[LOI] Lua chon khong hop le, vui long nhap tu 1 den 5!');
    }
  } while (menuChoice !== '5');
}

main();