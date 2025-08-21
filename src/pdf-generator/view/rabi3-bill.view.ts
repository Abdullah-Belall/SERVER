import { formatDate, getSlug } from 'src/utils/base';
import { CarType, PaidStatusEnum } from 'src/types/enums/product.enum';
export const carTypesArray = [
  { name: CarType.SEDAN, slug: 'سيدان' },
  { name: CarType.HATCHBACK, slug: 'هاتشباك' },
  { name: CarType.SUV, slug: 'SUV' },
  { name: CarType.CROSSOVER, slug: 'كروس أوفر' },
  { name: CarType.COUPE, slug: 'كوبيه' },
  { name: CarType.CONVERTIBLE, slug: 'كابريوليه' },
  { name: CarType.PICKUP, slug: 'بيك أب' },
  { name: CarType.MINIVAN, slug: 'ميني فان' },
  { name: CarType.VAN, slug: 'فان' },
  { name: CarType.STATION_WAGON, slug: 'ستيشن واجن' },
  { name: CarType.TRUCK, slug: 'شاحنة' },
  { name: CarType.OFFROAD, slug: 'أوف رود' },
  { name: CarType.ELECTRIC, slug: 'كهربائي' },
];

export const rabi3BillView = (hostname: string, data: any) => {
  const { bills } = data;
  const billsData = bills?.data?.filter((e) => Number(e.qty) > 0);
  const sortedBills: any = billsData?.filter((e) => e?.sort?.product?.name);
  const items = sortedBills.map((e: any, i: number, arr: any) => {
    return `<ul style="margin: 0;display: flex; background-color: white; color: #45616c; ${i !== arr.length - 1 ? 'border-bottom: 2px solid #9fadb0;' : ''}">
        <li style="padding: 12px 0; display: flex; flex-direction: column; justify-content: center; padding-left: 16px; padding-right: 16px; gap: 8px; text-align: center; width: 50%;">
          ${e?.sort?.name}
        </li>
        <li style="padding: 12px 0; display: flex; flex-direction: column; justify-content: center; padding-left: 16px; padding-right: 16px; gap: 8px; text-align: center; width: 13%; border-left: 2px solid #9fadb0; border-right: 2px solid #9fadb0;">
          ${e?.qty}
        </li>
        <li style="display: flex; flex-direction: column; gap: 8px; justify-content: center; text-align: center; width: 13%; border-left: 2px solid #9fadb0;">
          ${Number(e?.price ?? e?.unit_price).toLocaleString()}
        </li>
        <li style="display: flex; flex-direction: column; gap: 8px; justify-content: center; text-align: center; width: 24%;">
          ${(Number(e?.price ?? e?.unit_price) * Number(e?.qty || 0)).toLocaleString()}
        </li>
      </ul>`;
  });
  const masna3a: any = billsData?.filter((e) => !e?.sort?.product?.name);
  const masna3aItems = masna3a.map((e: any, i: number, arr: any) => {
    return `<ul style="margin: 0;display: flex; background-color: white; color: #45616c; ${i !== arr.length - 1 ? 'border-bottom: 2px solid #9fadb0;' : ''} ${i === 0 && items.length > 0 ? 'border-top: 2px solid #9fadb0;' : ''}">
        <li style="padding: 12px 0; display: flex; flex-direction: column; justify-content: center; padding-left: 16px; padding-right: 16px; gap: 8px; text-align: center; width: 50%;">
          ${e?.additional_band || ''}
        </li>
        <li style="padding: 12px 0; display: flex; flex-direction: column; justify-content: center; padding-left: 16px; padding-right: 16px; gap: 8px; text-align: center; width: 13%; border-left: 2px solid #9fadb0; border-right: 2px solid #9fadb0;">
          ${e?.qty}
        </li>
        <li style="display: flex; flex-direction: column; gap: 8px; justify-content: center; text-align: center; width: 13%; border-left: 2px solid #9fadb0;">
          ${Number(e?.price ?? e?.unit_price).toLocaleString()}
        </li>
        <li style="display: flex; flex-direction: column; gap: 8px; justify-content: center; text-align: center; width: 24%;">
          ${(Number(e?.price ?? e?.unit_price) * Number(e?.qty || 0)).toLocaleString()}
        </li>
      </ul>`;
  });
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@200..1000&display=swap" rel="stylesheet">
  <title>Document</title>
  <style>
    body {
      font-family: 'Cairo', sans-serif;
      margin: 0;
      padding: 0;
      direction: rtl;
    }
    * {
      box-sizing: border-box;
    }
    .print-content {
      min-height: 100vh;
      position: relative;
      display: flex;
      flex-direction: column;
      width: 100%;
      background-color: white;
    }
    .text-center {
      text-align: center;
    }
    .mx-auto {
      margin-left: auto;
      margin-right: auto;
    }
    .text-black {
      color: black;
    }
    .font-bold {
      font-weight: bold;
    }
    .text-80px {
      font-size: 80px;
    }
    .w-full {
      width: 100%;
    }
    .flex {
      display: flex;
    }
    .flex-col {
      flex-direction: column;
    }
    .items-start {
      align-items: start;
    }
    .pr-30px {
      padding-right: 30px;
    }
    .gap-1 {
      gap: 4px;
    }
    .text-20px {
      font-size: 20px;
    }
    .pr-60px {
      padding-right: 60px;
    }
    .items-center {
      align-items: center;
    }
    .font-semibold {
      font-weight: 600;
    }
    .gap-2 {
      gap: 8px;
    }
    .gap-3 {
      gap: 10px;
    }
    .px-2 {
      padding-left: 8px;
      padding-right: 8px;
    }
    .py-2 {
      padding-top: 8px;
      padding-bottom: 8px;
    }
    .bg-45616c {
      background-color: #45616c;
    }
    .rounded-md {
      border-radius: 6px;
    }
    .text-white {
      color: white;
    }
    .border-2 {
      border: 2px solid;
    }
    .border-9fadb0 {
      border-color: #9fadb0;
    }
    .tracking-widest {
      letter-spacing: 0.1em;
    }
    .mt-10px {
      margin-top: 10px;
    }
    .w-90 {
      width: 95%;
      max-width: 95%;
      box-sizing: border-box;
    }
    .rounded-md {
      border-radius: 6px;
    }
    .py-1-5 {
      padding-top: 6px;
      padding-bottom: 6px;
    }
    .px-1 {
      padding-left: 4px;
      padding-right: 4px;
    }
    .w-calc-100-3 {
      width: calc(100% / 3);
    }
    .mt-3px {
      margin-top: 3px;
    }
    .overflow-hidden {
      overflow: hidden;
    }
    .bg-45616c {
      background-color: #45616c;
    }
    .border-b-3 {
      border-bottom: 3px solid;
    }
    .text-white {
      color: white;
    }
    .py-2 {
      padding-top: 8px;
      padding-bottom: 8px;
    }
    .justify-center {
      justify-content: center;
    }
    .px-4 {
      padding-left: 16px;
      padding-right: 16px;
    }
    .text-xl {
      font-size: 20px;
    }
    .font-bold {
      font-weight: bold;
    }
    .whitespace-nowrap {
      white-space: nowrap;
    }
    .text-xs {
      font-size: 12px;
    }
    .border-x-2 {
      border-left: 2px solid;
      border-right: 2px solid;
    }
    .border-l-2 {
      border-left: 2px solid;
    }
    .pt-2 {
      padding-top: 8px;
    }
    .pb-1 {
      padding-bottom: 4px;
    }
    .border-t-2 {
      border-top: 2px solid;
    }
    .mt-1 {
      margin-top: 4px;
    }
    .rounded-xl {
      border-radius: 12px;
    }
    .gap-1 {
      gap: 4px;
    }
    .text-lg {
      font-size: 18px;
    }
    .p-2 {
      padding: 8px;
    }
    .justify-between {
      justify-content: space-between;
    }
    .flex-row-reverse {
      flex-direction: row-reverse;
    }
    .justify-end {
      justify-content: flex-end;
    }
    .bg-45616c {
      background-color: #45616c;
    }
    .h-40px {
      height: 40px;
    }
    .w-160px {
      width: 160px;
    }
    .justify-center {
      justify-content: center;
    }
    .items-center {
      align-items: center;
    }
    .relative {
      position: relative;
    }
    .text-sm {
      font-size: 14px;
    }
    .justify-start {
      justify-content: flex-start;
    }
    .justify-center {
      justify-content: center;
    }
    .justify-end {
      justify-content: flex-end;
    }
    .absolute {
      position: absolute;
    }
    .bottom-neg-10px {
      bottom: -10px;
    }
    .left-neg-20px {
      left: -20px;
    }
    .rotate-35deg {
      transform: rotate(35deg);
    }
    .opacity-7 {
      opacity: 0.7;
    }
  </style>
</head>
<body>
  <div class="print-content">
    <h1 style="margin: 0 auto" class="text-80px font-bold text-center mx-auto text-black">
      ${getBillData(hostname)?.title}
    </h1>
    <div class="w-full flex flex-col items-start pr-30px gap-1">
      <p style="margin: 0" class="font-bold text-20px pr-60px text-black">
        لجميع انواع السيارات ${getBillData(hostname)?.carsType}
      </p>
      <div class="flex items-center font-semibold gap-2 text-black">
        <p style="margin: 0; width: 36px; height: 50px; display: flex; align-items: center; justify-content: center;"
        class="px-2 py-2 bg-45616c rounded-md text-white border-2 border-9fadb0">
          <i class="fa-solid fa-location-dot"></i>
        </p>
        الغردقة منطقة الحرفين امام المجمع الصناعي بالغردقة
      </div>
      <div class="flex items-center font-semibold gap-2 tracking-widest text-black">
        <p style="margin: 0; width: 36px; height: 50px; display: flex; align-items: center; justify-content: center;"
        class="px-2 py-2 bg-45616c rounded-md text-white border-2 border-9fadb0">
          <i class="fa-solid fa-phone"></i>
        </p>
        ${getBillData(hostname)?.phones}
      </div>
    </div>
    <div class="flex gap-1 font-semibold mt-10px w-90 mx-auto text-black">
        <div class="border-2 border-9fadb0 rounded-md py-1-5 px-1 text-center w-calc-100-3">
          ${formatDate(bills?.totals?.created_at as Date)}
        </div>
      <div class="mx-auto border-2 border-9fadb0 rounded-md py-1-5 px-1 text-center w-calc-100-3">
        ${'فاتورة مبيعات - ' + shortIdGenerator(Number(bills?.bill_id))}
      </div>
        <div class="border-2 border-9fadb0 rounded-md py-1-5 px-1 text-center w-calc-100-3">
          الرقم/ ${bills?.car?.client?.contacts && bills?.car?.client?.contacts?.length > 0 ? bills?.car?.client?.contacts[0].phone?.slice(1) + '+' : 'لا يوجد'}
        </div>
    </div>

    <div class="flex gap-1 font-semibold mt-3px w-90 mx-auto text-black">
      <div class="border-2 border-9fadb0 rounded-md py-1-5 px-1 text-center w-calc-100-3">
        المطلوب من: ${bills?.car?.client?.user_name}
      </div>
      <div class="mx-auto border-2 border-9fadb0 rounded-md py-1-5 px-1 text-center w-calc-100-3">
        السيارة: ${bills?.car?.mark && bills?.car?.mark !== '' ? bills?.car?.mark : ''} ${bills?.car?.type && (bills?.car?.type as any) !== '' ? getSlug(bills?.car?.type as string, carTypesArray) : ''}
      </div>

      <div class="border-2 border-9fadb0 rounded-md py-1-5 px-1 text-center w-calc-100-3">
        لوحة الترخيص: ${bills?.car?.plate && bills?.car?.plate !== '' ? bills?.car?.plate : 'غير مسجل'}
      </div>
    </div>
    <div class="flex flex-col w-90 mx-auto mt-1 border-2 border-9fadb0 rounded-xl overflow-hidden">
      <ul  style="margin: 0" class="flex bg-45616c border-b-3 border-9fadb0 text-white">
        <li class="py-2 flex flex-col justify-center px-4 gap-1 text-center" style="width: 50%;">
          <p style="margin: 0" class="text-xl font-bold whitespace-nowrap">البند</p>
          <p style="margin: 0" class="text-xs">ITEM</p>
        </li>
        <li class="py-2 flex flex-col justify-center px-4 gap-2 text-center border-x-2 border-white" style="width: 13%;">
          <p style="margin: 0" class="text-xl font-bold whitespace-nowrap">الكمية</p>
          <p style="margin: 0" class="text-xs">QTY</p>
        </li>
        <li class="flex flex-col gap-2 text-center border-l-2 border-white" style="width: 13%;">
          <p style="margin: 0" class="pt-2 font-bold whitespace-nowrap">سعر الوحدة</p>
          <p style="margin: 0;text-wrap: nowrap;" class="text-xs px-4 pb-1">UNIT PRICE</p>
          <div class="text-center py-1 border-t-2 border-white px-4">جنية</div>
        </li>
        <li class="flex flex-col gap-2 text-center" style="width: 24%;">
          <p style="margin: 0" class="text-xl pt-2 font-bold whitespace-nowrap px-4">المبلغ الاجمالي</p>
          <p style="margin: 0" class="text-xs px-4">TOTAL AMOUNT</p>
          <div style="margin-top: -3.5px;" class="text-center py-1 border-t-2 border-white px-4">جنية</div>
        </li>
      </ul>
      ${[items, masna3aItems].flat().join('')}
    </div>
    <div class="flex flex-col gap-1 w-90 mx-auto mt-1 border-2 border-9fadb0 rounded-md p-2 text-lg font-bold">
      <div class="flex items-center justify-between text-black">
        <div class="w-full flex items-center gap-3 flex-row-reverse justify-end">
          الاجمالي
          <div class="bg-45616c border-2 border-9fadb0 bg-45616c rounded-md h-40px w-160px text-white flex justify-center items-center">
            ${Number(bills?.totals?.totalPrice).toLocaleString()}
          </div>
        </div>
          <div class="w-full flex items-center gap-3 justify-end">
            مدفوع تحت الحساب
            <div class="bg-45616c border-2 border-9fadb0 bg-45616c rounded-md h-40px w-160px text-white flex justify-center items-center">
              ${Number(bills?.totals?.take_from_client_balance).toLocaleString()}
            </div>
          </div>
      </div>
        <div class="flex items-center justify-between text-black">
          <div style="text-wrap: nowrap;" class="w-full flex items-center gap-3 flex-row-reverse justify-end">
            الباقي في حساب العميل
            <div class="bg-45616c border-2 border-9fadb0 bg-45616c rounded-md h-40px w-160px text-white flex justify-center items-center">
              ${Number(bills?.totals?.client_balance).toLocaleString()}
            </div>
          </div>
          <div class="w-full flex items-center justify-end gap-3">
            المطلوب
            <div class="bg-45616c border-2 border-9fadb0 bg-45616c rounded-md h-40px w-160px text-white flex justify-center items-center">
              ${Number(bills?.totals?.client_depts).toLocaleString()}
            </div>
          </div>
        </div>
      
    </div>
      <div class="relative flex gap-1 w-90 text-black mx-auto mt-1 border-2 border-9fadb0 rounded-md p-2 text-lg font-bold">
        <div class="text-sm w-full flex items-center gap-3 justify-start">
          وسيلة الدفع: ${getSlug(bills?.totals?.payment_method, methodsArray)}
        </div>
        <div class="text-sm w-full flex items-center gap-3 justify-center">
          حالة الدفع: ${getSlug(bills?.totals?.paid_status, paidStatusArray)}
        </div>
        ${
          bills?.totals?.paid_status === 'installments'
            ? `
          <div class="text-sm w-full flex items-center gap-3 justify-end">
            المقدم: ${Number(bills?.totals?.down_payment || 0)}
          </div>
        `
            : ''
        }
      </div>
  </div>
</body>
    <script src="https://kit.fontawesome.com/e13726c6ea.js" crossorigin="anonymous"></script>
</html>
`;
};

const billParamters: {
  domain: string;
  title: string;
  carsType: string;
  phones: string;
}[] = [
  {
    domain: 'elrabi3.nabdtech.store',
    title: `الربيع سيرفس`,
    carsType: 'البنزين',
    phones: '01224957535 - 01155607133',
  },
  {
    domain: 'toyota.nabdtech.store',
    title: `
      <div className="flex items-center gap-1">
        <p style="margin: 0">D TOYOTA</p>
      </div>
    `,
    carsType: 'الجاز',
    phones: '01224957535 - 01155607133',
  },
  {
    domain: 'localhost',
    title: `
      <div className="flex items-center gap-1">
        <p style="margin: 0">TOYOTA</p>
        <TbBrandToyota />
        <p style="margin: 0">D</p>
      </div>
    `,
    carsType: 'الجاز',
    phones: '01224957535 - 01155607133',
  },
];
const getBillData = (domain: string) => {
  return billParamters.find((e) => e.domain === domain);
};
export const shortIdGenerator = (shortId: number | string) => {
  const rest = 6 - shortId?.toString().length;
  const shortIdArr = [];
  for (let i = 0; i < rest; i++) {
    shortIdArr.push(0);
  }
  shortIdArr.push(shortId);
  return shortIdArr.join('');
};

export enum PaymentMethodsEnum {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  VF_CASH = 'vf_cash',
}
export const methodsArray = [
  { name: PaymentMethodsEnum.CASH, slug: 'كاش' },
  { name: PaymentMethodsEnum.BANK_TRANSFER, slug: 'تحويل بنكي' },
  { name: PaymentMethodsEnum.VF_CASH, slug: 'فودافون كاش' },
];

export const paidStatusArray = [
  { name: PaidStatusEnum.PAID, slug: 'دفع الأن' },
  { name: PaidStatusEnum.INSTALLMENTS, slug: 'دفع بالأقساط' },
  { name: PaidStatusEnum.PENDING, slug: 'لم يدفع بعد' },
];
