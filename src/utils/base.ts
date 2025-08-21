export const ErrorMsg =
  'There is a problem with the server. Please try again later.';
export const StartYear = 2025;

export const PaymentMethodsSlugs = [
  { name: 'cash', slug: 'كاش' },
  { name: 'bank_transfer', slug: 'تحويل بنكي' },
  { name: 'vf_cash', slug: 'فودافون كاش' },
];

export const PaidStatusSlug = [
  { name: 'paid', slug: 'دفع الان' },
  { name: 'pending', slug: 'لم يدفع بعد' },
];
export const periodsArray = [
  { name: 'weekly', slug: 'اسبوع' },
  { name: 'month', slug: 'شهري' },
  { name: 'quarter', slug: 'ربع سنوي' },
  { name: 'halfyear', slug: 'نصف سنوي' },
  { name: 'year', slug: 'سنوي' },
];
export const getSlug = (
  name: string,
  arr: { name: string; slug: string }[],
) => {
  return arr.find((e) => e.name === name)?.slug;
};

export const formatDate = (input: string | Date) => {
  let date: Date;

  if (typeof input === 'string') {
    const fixedString = input.replace(' ', 'T').split('.')[0];
    date = new Date(fixedString);
  } else {
    date = new Date(input);
  }

  if (isNaN(date.getTime())) {
    return 'تاريخ غير صالح';
  }

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Cairo',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: string) =>
    parts.find((p) => p.type === type)?.value || '';

  const hours = getPart('hour');
  const minutes = getPart('minute');
  const day = getPart('day');
  const month = getPart('month');
  const year = getPart('year');
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};
