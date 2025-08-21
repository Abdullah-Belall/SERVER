import { formatDate, getSlug } from 'src/utils/base';
import {
  carTypesArray,
  methodsArray,
  paidStatusArray,
} from './rabi3-bill.view';
import { PaidStatusEnum } from 'src/types/enums/product.enum';

const titles = [
  {
    domain: 'elrabi3.nabdtech.store',
    title: 'Al Rabie Service Center',
  },
  {
    domain: 'toyota.nabdtech.store',
    title: 'DToyota Service Center',
  },
];

export const rabi3DailyReportView = (hostname: string, data: any) => {
  const advances = data?.advances?.map((advance: any, index: number) => {
    return `
        <div key="${index}" class="w-[calc(25%-5px)] bg-white border-2 border-[#eee] flex flex-col p-2">
          <h1 class="text-[12px] font-bold">${advance?.worker?.user_name}</h1>
          <p class="text-[24px] text-[#6c16db] font-bold">${Number(advance?.amount || 0).toLocaleString()}</p>
        </div>
      `;
  });

  const orders = data?.orders?.map((order: any, index: number) => {
    let totalCostPrice = 0;
    return `
      <div key="${index}" class="w-full mt-6">
        <div class="flex flex-col gap-1">
            <div class="flex gap-1">
              <div
                class="w-full px-4 py-4 text-start text-nowrap bg-[#d8d1f7] border-2 border-[#4a30b8] rounded-md font-semibold"
              >
                الأستاذ: <span class="text-[#4a30b8]">${order?.car?.client?.user_name}</span>
              </div>
              <div
                class="w-full px-4 py-4 text-start text-nowrap bg-[#d8d1f7] border-2 border-[#4a30b8] rounded-md font-semibold"
              >
                السيارة: <span class="text-[#4a30b8]">${order?.car?.mark} ${order?.car?.type && (order?.car?.type as any) !== '' ? getSlug(order?.car?.type as string, carTypesArray) : ''}</span>
              </div>
            </div>
          <div class="flex gap-1">
            <div
              class="w-full px-4 py-4 text-center text-nowrap bg-[#d8d1f7] border-2 border-[#4a30b8] rounded-md font-semibold"
            >
              طريقة الدفع: <span class="text-[#4a30b8]">${getSlug(order?.payment?.payment_method, methodsArray)}</span>
            </div>
            <div
              class="w-full px-4 py-4 text-center text-nowrap bg-[#d8d1f7] border-2 border-[#4a30b8] rounded-md font-semibold"
            >
              حالة الدفع: <span class="text-[#4a30b8]">${getSlug(order?.payment?.status, paidStatusArray)}</span>
            </div>
            <div
              class="w-full px-4 py-4 text-center text-nowrap bg-[#d8d1f7] border-2 border-[#4a30b8] rounded-md font-semibold"
            >
              تاريخ الفاتورة: <span class="text-[#4a30b8] text-nowrap">${formatDate(order?.created_at)}</span>
            </div>
          </div>
          <div class="flex gap-1">
            ${
              order?.payment?.client_balance &&
              order?.payment?.client_balance !== 0
                ? `
                <div
              class="w-full px-4 py-4 text-center text-nowrap bg-[#d8d1f7] border-2 border-[#4a30b8] rounded-md font-semibold"
            >
              المأخوذ من حساب العميل: <span class="text-[#4a30b8]">${Number(order?.payment?.client_balance || 0).toLocaleString()}</span>
            </div>
            <div
              class="w-full px-4 py-4 text-center text-nowrap bg-[#d8d1f7] border-2 border-[#4a30b8] rounded-md font-semibold"
            >
              الباقي في حساب العميل: <span class="text-[#4a30b8]">${Number(order?.car?.client?.balance || 0).toLocaleString()}</span>
            </div>
                `
                : ''
            }
          ${
            order?.payment?.status === PaidStatusEnum.INSTALLMENTS
              ? `
            <div
              class="w-full px-4 py-4 text-center text-nowrap bg-[#d8d1f7] border-2 border-[#4a30b8] rounded-md font-semibold"
            >
              المقدم: <span class="text-[#4a30b8]">${Number(order?.payment?.down_payment || 0).toLocaleString()}</span>
            </div>
              `
              : ''
          }
          </div>
        </div>
        <div class="mt-2 flex flex-col">
          <ul class="flex rounded-2xl bg-[#4a30b8]">
            <li class="py-3 text-white font-bold text-center w-[50%]">التفاصيل</li>
            <li class="py-3 text-white font-bold text-center w-[16%] border-x-2 border-white">
              الكمية
            </li>
            <li class="py-3 text-white font-bold text-center w-[17%]">س.ش</li>
            <li class="py-3 text-white font-bold text-center w-[17%] border-r-2 border-white">
              س.ب
            </li>
          </ul>
          ${order?.order_items
            ?.map((item: any, index: number) => {
              totalCostPrice += Number(
                Number(item?.total_cost_price || 0) / Number(item?.qty || 1),
              );
              return `
                <ul key="${index}" class="flex border-b-2 border-[#4a30b8]">
                  <li class="py-3 font-bold text-center w-[50%]">${item?.sort?.name || item?.additional_band}</li>
                  <li class="py-3 font-bold text-center w-[16%] border-x-2 border-[#4a30b8]">${item?.qty}</li>
                  <li class="py-3 font-bold text-center w-[17%] border-l-2 border-[#4a30b8]">${Number((Number(item?.total_cost_price || 0) / Number(item?.qty || 1)).toFixed(2)).toLocaleString()}</li>
                  <li class="py-3 font-bold text-center w-[17%]">${Number(item?.unit_price || item?.price || 0).toLocaleString()}</li>
                </ul>
                `;
            })
            ?.join('')}
          <ul class="flex rounded-2xl bg-[#d8d1f7]">
            <li class="py-3 font-bold text-center w-[50%]">الاجمالي</li>
            <li class="py-3 font-bold text-center w-[16%] border-x-2 border-[#4a30b8]">-</li>
            <li class="py-3 font-bold text-center w-[17%] border-l-2 border-[#4a30b8]">${Number(Number(totalCostPrice || 0).toFixed()).toLocaleString()}</li>
            <li class="py-3 font-bold text-center w-[17%]">${Number(order?.total_price_after || 0).toLocaleString()}</li>
          </ul>
        </div>
      </div>
      `;
  });
  const prev_orders = data?.prev_orders?.map((order: any, index: number) => {
    return `
        <ul key="${index}" class="flex border-b-2 border-[#4a30b8]">
          <li class="py-3 font-bold text-center w-[42.5%]">${order?.car?.client?.user_name}</li>
          <li class="py-3 font-bold text-center w-[42.5%] border-x-2 border-[#4a30b8]">
            ${order?.car?.mark}
          </li>
          <li class="py-3 font-bold text-center w-[15%]">${order?.total_price_after}</li>
        </ul>
        `;
  });
  const expenses = data?.expenses?.map((expense: any, index: number) => {
    return `
      <ul key="${index}" class="flex border-b-2 border-[#4a30b8]">
        <li class="py-3 font-bold text-center w-[50%]">${expense?.name}</li>
        <li class="py-3 font-bold text-center w-[35%] border-x-2 border-[#4a30b8]">${expense?.note && expense?.note !== '' ? expense?.note : '-'}</li>
        <li class="py-3 font-bold text-center w-[15%]">${Number(expense?.amount || 0).toLocaleString()}</li>
      </ul>
    `;
  });
  const costs = data?.costs?.map((cost: any, index: number) => {
    return `
      <ul key="${index}" class="flex border-b-2 border-[#4a30b8]">
        <li class="py-3 font-bold text-center w-[58%]">${cost?.sort?.name}</li>
        <li class="py-3 font-bold text-center w-[14%] border-x-2 border-[#4a30b8]">${cost?.qty}</li>
        <li class="py-3 font-bold text-center w-[14%]">${(Number(cost?.price || 0) / Number(cost?.qty || 1)).toLocaleString()}</li>
        <li class="py-3 font-bold text-center w-[14%] border-r-2 border-[#4a30b8]">${Number(cost?.price || 0).toLocaleString()}</li>
      </ul>
    `;
  });
  const theBiggerNumber = Math.max(
    data?.sales,
    data?.totalCosts,
    data?.totalExpenses,
    data?.totalReturns,
  );
  let selectedGraphNumber: {
    max: number;
    cut: number;
  };
  for (let i = 0; i < graphNumbers.length; i++) {
    if (theBiggerNumber <= graphNumbers[i].max) {
      selectedGraphNumber = graphNumbers[i];
      break;
    }
  }
  const graphGenerators = `
      <li class="flex items-center gap-1.5 w-full">
        <span class="text-[10px] w-[10%] text-end">${selectedGraphNumber.max}</span>
        <span class="h-[2px] bg-[#eee] w-[90%]"></span>
      </li>
      <li class="flex items-center gap-1.5 w-full">
        <span class="text-[10px] w-[10%] text-end">${selectedGraphNumber.max - selectedGraphNumber.cut}</span>
        <span class="h-[2px] bg-[#eee] w-[90%]"></span>
      </li>
      <li class="flex items-center gap-1.5 w-full">
        <span class="text-[10px] w-[10%] text-end">${selectedGraphNumber.max - selectedGraphNumber.cut * 2}</span>
        <span class="h-[2px] bg-[#eee] w-[90%]"></span>
      </li>
      <li class="flex items-center gap-1.5 w-full">
        <span class="text-[10px] w-[10%] text-end">${selectedGraphNumber.max - selectedGraphNumber.cut * 3}</span>
        <span class="h-[2px] bg-[#eee] w-[90%]"></span>
      </li>
      <li class="flex items-center gap-1.5 w-full">
        <span class="text-[10px] w-[10%] text-end">${selectedGraphNumber.max - selectedGraphNumber.cut * 4}</span>
        <span class="h-[2px] bg-[#eee] w-[90%]"></span>
      </li>
      <li class="flex items-center gap-1.5 w-full">
        <span class="text-[10px] w-[10%] text-end">${selectedGraphNumber.max - selectedGraphNumber.cut * 5}</span>
        <span class="h-[2px] bg-[#eee] w-[90%]"></span>
      </li>
  `;
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Cairo:wght@200..1000&display=swap"
      rel="stylesheet"
    />
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      * {
        font-family: "Cairo", sans-serif;
      }
    </style>
    <title>Document</title>
  </head>
  <body class="px-[40px] bg-[#fbf8ff]">
    <section class="min-h-dvh">
      <h1 class="text-[38px] w-fit mx-auto font-bold">${titles.find((title) => title.domain === hostname)?.title || 'Service Center'}</h1>
      <p
        class="border-2 border-[#eee] bg-white w-fit px-2 py-1 text-[14px] text-[#6c16db] font-semibold"
      >
        Date: ${formatDate((data?.date.toString()?.slice(0, 10) || new Date().toString())?.slice(0, 10))}
      </p>
      <div class="flex gap-1 items-center w-full mt-3">
        <div class="flex flex-col border-2 border-[#eee] bg-white p-2 w-full">
          <h2 class="text-[12px] font-bold">Net profit</h2>
          <p class="text-[#6c16db] text-[32px] font-bold">${data?.netProfit}</p>
        </div>
        <div class="flex flex-col border-2 border-[#eee] bg-white p-2 w-full">
          <h2 class="text-[12px] font-bold">Net profit for expenses</h2>
          <div class="flex justify-center items-center gap-3">
            <p class="h-[28px] w-full bg-[#00eacd] relative">
              <span class="absolute top-0 left-0 w-[${((data?.netProfit || 0) / (data?.totalExpenses || 1)) * 100 > 100 ? 100 : ((data?.totalCosts || 1) / data?.netProfit) * 100}%] h-[100%] bg-[#6c16db]"></span>
            </p>
          <p class="text-[#6c16db] text-[32px] font-bold">${(((data?.netProfit || 0) / (data?.totalExpenses || 1)) * 100).toFixed()}%</p>
          </div>
        </div>
      </div>
      <div class="flex gap-1 items-center w-full mt-3">
        <div class="flex flex-col border-2 border-[#eee] bg-white p-2 w-full">
          <h2 class="flex items-center justify-between w-full">
            <span class="text-[12px] font-bold">Costs</span
            ><span class="text-[#6c16db]"><i class="fa-solid fa-money-bill"></i></span>
          </h2>
          <p class="text-[#6c16db] text-[32px] font-bold">${data?.totalCosts}</p>
        </div>
        <div class="flex flex-col border-2 border-[#eee] bg-white p-2 w-full">
          <h2 class="flex items-center justify-between w-full">
            <span class="text-[12px] font-bold">Sales</span
            ><span class="text-[#6c16db]"><i class="fa-solid fa-cart-shopping"></i></span>
          </h2>
          <p class="text-[#6c16db] text-[32px] font-bold">${data?.sales}</p>
        </div>
        <div class="flex flex-col border-2 border-[#eee] bg-white p-2 w-full">
          <h2 class="flex items-center justify-between w-full">
            <span class="text-[12px] font-bold">Expenses</span
            ><span class="text-[#6c16db]"><i class="fa-solid fa-calculator"></i></span>
          </h2>
          <p class="text-[#6c16db] text-[32px] font-bold">${data?.totalExpenses}</p>
        </div>
      </div>
      <div class="flex gap-2 items-start w-full mt-4 flex-col">
        <h1 class="text-[12px] mx-auto font-semibold">Revenue By Product</h1>
        <div class="flex gap-3 w-full">
          <ul class="flex flex-col gap-[30px] w-full relative w-full">
            ${graphGenerators}
            <li class="absolute top-0 right-0 w-[89%] h-full flex justify-between items-end">
              <div class="h-full flex flex-col justify-end items-end mb-[-8px]">
                <span class="bg-[#373789] rounded-t-md px-3 h-[${(data?.sales / selectedGraphNumber.max) * 100}%]"></span>
                <span class="text-[10px] font-semibold">Sales</span>
              </div>
              <div class="h-full flex flex-col justify-end items-end mb-[-8px]">
                <span class="bg-[#373789] rounded-t-md px-3 h-[${(data?.totalExpenses / selectedGraphNumber.max) * 100}%]"></span>
                <span class="text-[10px] font-semibold">Expenses</span>
              </div>
              <div class="h-full flex flex-col justify-end items-end mb-[-8px]">
                <span class="bg-[#373789] rounded-t-md px-3 h-[${(data?.totalCosts / selectedGraphNumber.max) * 100}%]"></span>
                <span class="text-[10px] font-semibold">Costs</span>
              </div>
              <div class="h-full flex flex-col justify-end items-end mb-[-8px]">
                <span class="bg-[#373789] rounded-t-md px-3 h-[${(data?.totalReturns / selectedGraphNumber.max) * 100}%]"></span>
                <span class="text-[10px] font-semibold">Returns</span>
              </div>
            </li>
          </ul>
          <ul class="flex flex-col w-[30%] items-center justify-between">
            <li class="flex flex-col">
              <h1 class="text-[10px] font-semibold">Sales</h1>
              <p class="text-[16px] font-bold text-[#6c16db]">${data?.sales}</p>
            </li>
            <li class="flex flex-col">
              <h1 class="text-[10px] font-semibold">Expenses</h1>
              <p class="text-[16px] font-bold text-[#6c16db]">${data?.totalExpenses}</p>
            </li>
            <li class="flex flex-col">
              <h1 class="text-[10px] font-semibold">Costs</h1>
              <p class="text-[16px] font-bold text-[#6c16db]">${data?.totalCosts}</p>
            </li>
            <li class="flex flex-col">
              <h1 class="text-[10px] font-semibold">Returns</h1>
              <p class="text-[16px] font-bold text-[#6c16db]">${data?.totalReturns}</p>
            </li>
          </ul>
        </div>
      </div>
      <div class="flex flex-col gap-3 border-2 border-[#eee] bg-white p-2 w-full mt-[40px]">
        <h2 class="text-[12px] font-bold">ancestor</h2>
        <div class="flex flex-wrap gap-[5px]">
          ${advances.join('')}
        </div>
      </div>
    </section>
    <!-- ! -->
    <section dir="rtl" class="min-h-dvh mt-[30px]">
      <h1 class="text-[38px] w-fit mx-auto font-bold mb-3">فواتير المبيعات</h1>
      ${
        orders?.length > 0
          ? orders.join('')
          : `
          <div class="mx-auto p-4 bg-[#d8d1f7] w-[80%] text-center rounded-2xl mt-[30px] font-semibold">
            لا يوجد
          </div>
            `
      }
    </section>
        <!-- ! -->
    <section dir="rtl" class="min-h-dvh mt-[30px]">
      <h1 class="text-[38px] w-fit mx-auto font-bold mb-3">فواتير مبيعات قديمة (مسددة اليوم)</h1>
      ${
        prev_orders?.length > 0
          ? `
        <div class="mt-2 flex flex-col">
        <ul class="flex rounded-2xl bg-[#4a30b8]">
          <li class="py-3 text-white font-bold text-center w-[42.5%]">العميل</li>
          <li class="py-3 text-white font-bold text-center w-[42.5%] border-x-2 border-white">
            السيارة
          </li>
          <li class="py-3 text-white font-bold text-center w-[15%]">المبلغ</li>
        </ul>
        ${prev_orders.join('')}
        <ul class="flex rounded-2xl bg-[#d8d1f7]">
          <li class="py-3 font-bold text-center w-[42.5%]">الاجمالي</li>
          <li class="py-3 font-bold text-center w-[42.5%] border-x-2 border-[#4a30b8]">-</li>
          <li class="py-3 font-bold text-center w-[15%]">${data?.prev_orders?.reduce((acc, curr) => acc + Number(curr.total_price_after), 0)}</li>
        </ul>
      </div>
        `
          : `
      <div class="mx-auto p-4 bg-[#d8d1f7] w-[80%] text-center rounded-2xl mt-[30px] font-semibold">
        لا يوجد
      </div>
        `
      }
      
    </section>
    <!-- ! -->
    <section dir="rtl" class="min-h-dvh mt-[30px]">
      <h1 class="text-[38px] w-fit mx-auto font-bold mb-3">فواتير المصاريف</h1>
      ${
        expenses?.length > 0
          ? `
        <div class="w-full mt-6">
        <div class="mt-2 flex flex-col">
          <ul class="flex rounded-2xl bg-[#4a30b8]">
            <li class="py-3 text-white font-bold text-center w-[50%]">التفاصيل</li>
            <li class="py-3 text-white font-bold text-center w-[35%] border-x-2 border-white">
              ملاحظات
            </li>
            <li class="py-3 text-white font-bold text-center w-[15%]">المبلغ</li>
          </ul>
          ${expenses.join('')}
          <ul class="flex rounded-2xl bg-[#d8d1f7]">
            <li class="py-3 font-bold text-center w-[50%]">الاجمالي</li>
            <li class="py-3 font-bold text-center w-[35%] border-x-2 border-[#4a30b8]">-</li>
            <li class="py-3 font-bold text-center w-[15%]">${data?.totalExpenses}</li>
          </ul>
        </div>
      </div>
        `
          : `
          <div class="mx-auto p-4 bg-[#d8d1f7] w-[80%] text-center rounded-2xl mt-[30px] font-semibold">
            لا يوجد
          </div>
            `
      }
    </section>
    <!-- ! -->
    <section dir="rtl" class="min-h-dvh mt-[30px]">
      <h1 class="text-[38px] w-fit mx-auto font-bold mb-3">فواتير التكاليف (المشتريات)</h1>
      ${
        costs?.length > 0
          ? `
          <div class="w-full mt-6">
          <div class="mt-2 flex flex-col">
            <ul class="flex rounded-2xl bg-[#4a30b8]">
              <li class="py-3 text-white font-bold text-center w-[58%]">التفاصيل</li>
              <li class="py-3 text-white font-bold text-center w-[14%] border-x-2 border-white">
                الكمية
              </li>
              <li class="py-3 text-white font-bold text-center w-[14%]">سعر الوحدة</li>
              <li class="py-3 text-white font-bold text-center border-r-2 border-white w-[14%]">
                الاجمالي
              </li>
            </ul>
            ${costs.join('')}
            <ul class="flex rounded-2xl bg-[#d8d1f7]">
              <li class="py-3 font-bold text-center w-[58%]">الاجمالي</li>
              <li class="py-3 font-bold text-center w-[14%] border-x-2 border-[#4a30b8]">-</li>
              <li class="py-3 font-bold text-center w-[14%] border-[#4a30b8]">-</li>
              <li class="py-3 font-bold text-center w-[14%] border-r-2 border-[#4a30b8]">${data?.totalAllCosts}</li>
            </ul>
          </div>
        </div>
        `
          : `
          <div class="mx-auto p-4 bg-[#d8d1f7] w-[80%] text-center rounded-2xl mt-[30px] font-semibold">
            لا يوجد
          </div>
            `
      }
      
    </section>
  </body>
  <script src="https://kit.fontawesome.com/e13726c6ea.js" crossorigin="anonymous"></script>
</html>
    `;
};
const graphNumbers = [
  {
    max: 500,
    cut: 100,
  },
  {
    max: 1000,
    cut: 200,
  },
  {
    max: 2000,
    cut: 400,
  },
  {
    max: 3000,
    cut: 600,
  },
  {
    max: 4000,
    cut: 800,
  },
  {
    max: 5000,
    cut: 1000,
  },
  {
    max: 6000,
    cut: 1200,
  },
  {
    max: 7000,
    cut: 1400,
  },
  {
    max: 8000,
    cut: 1600,
  },
  {
    max: 9000,
    cut: 1800,
  },
  {
    max: 10000,
    cut: 2000,
  },
  {
    max: 11000,
    cut: 2200,
  },
  {
    max: 12000,
    cut: 2400,
  },
  {
    max: 13000,
    cut: 2600,
  },
  {
    max: 14000,
    cut: 2800,
  },
  {
    max: 15000,
    cut: 3000,
  },
  {
    max: 16000,
    cut: 3200,
  },
  {
    max: 17000,
    cut: 3400,
  },
  {
    max: 18000,
    cut: 3600,
  },
  {
    max: 19000,
    cut: 3800,
  },
  {
    max: 20000,
    cut: 4000,
  },
];
