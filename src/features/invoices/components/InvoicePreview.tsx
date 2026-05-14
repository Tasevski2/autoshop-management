import { useMemo } from "react";
import type {
  InvoiceLineItem,
  InvoiceSeller,
  InvoiceBuyer,
} from "@/features/invoices/types";
import { fmt, fmtDate, calcLineItem } from "@/features/invoices/invoice-utils";
import { CUSTOMER_TYPE } from "@/lib/enums";


interface Props {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  seller: InvoiceSeller;
  buyer: InvoiceBuyer;
  lineItems: InvoiceLineItem[];
  amountInWords: string;
}

export default function InvoicePreview({
  invoiceNumber,
  invoiceDate,
  dueDate,
  seller,
  buyer,
  lineItems,
  amountInWords,
}: Props) {
  const { tariffs, totalWithoutVat, totalVat, totalWithVat } = useMemo(() => {
    let twv = 0;
    let tv = 0;
    const tMap = new Map<
      number,
      { base: number; vat: number; total: number }
    >();
    for (const item of lineItems) {
      const {
        afterDiscount,
        vatAmount,
        totalWithVat: itemTotal,
      } = calcLineItem(item);
      twv += afterDiscount;
      tv += vatAmount;
      const e = tMap.get(item.vatPercent) ?? { base: 0, vat: 0, total: 0 };
      e.base += afterDiscount;
      e.vat += vatAmount;
      e.total += itemTotal;
      tMap.set(item.vatPercent, e);
    }
    return {
      tariffs: Array.from(tMap.entries()),
      totalWithoutVat: twv,
      totalVat: tv,
      totalWithVat: twv + tv,
    };
  }, [lineItems]);

  const taxNumberLabel =
    buyer.customerType === CUSTOMER_TYPE.COMPANY ? "Даночен Број" : "Даночен Број(ЕМБГ)";

  return (
    <div
      className="bg-white text-black p-8 text-[11px] leading-[1.4] shadow-md border flex flex-col"
      style={{ width: "210mm", minHeight: "297mm", margin: "0 auto" }}
    >
      {/* ═══ TOP ZONE ═══ */}
      <div>
        {/* Header */}
        <div className="mb-3">
          <h1 className="ml-3 text-[22px] leading-none font-semibold tracking-wider">
            {seller.workshopName ?? seller.fullName}
          </h1>
          <div className="h-1.5 border-2 border-black" />
          <div className="text-[10px] text-gray-700 text-center">
            {seller.address && <div>{seller.address}</div>}
            <div>
              {[seller.phone && `Тел.: ${seller.phone}`]
                .filter(Boolean)
                .join(" * ")}
            </div>
            <div>
              {[
                seller.bankAccount && `Жиро сметка: ${seller.bankAccount}`,
                seller.bankName && `Банка: ${seller.bankName}`,
                seller.taxId && `ЕДБ: ${seller.taxId}`,
              ]
                .filter(Boolean)
                .join(" * ")}
            </div>
            {seller.email && <div>{seller.email}</div>}
          </div>
        </div>

        {/* Meta + Buyer */}
        <div className="flex justify-between mb-4">
          <div>
            <div className="mb-2">
              <span className="font-bold">Датум</span>
              <span className="ml-2 mr-4">{fmtDate(invoiceDate)}</span>
            </div>
            <div className="mb-3">
              <span className="font-bold">Валута</span>
              <span className="ml-2">{fmtDate(dueDate)}</span>
            </div>
            <div className="text-[15px] font-bold">
              ФАКТУРА
              <br />
              број: {invoiceNumber}
            </div>
          </div>
          <div className="border border-black p-3 min-w-[250px]">
            <h3 className="text-[13px] font-bold mb-1">{buyer.name}</h3>
            {buyer.address && <p className="text-[11px]">{buyer.address}</p>}
            {buyer.city && <p className="text-[11px]">{buyer.city}</p>}
            {buyer.taxNumber && (
              <p className="text-[11px]">
                {taxNumberLabel}: {buyer.taxNumber}
              </p>
            )}
          </div>
        </div>

        {/* Line items table */}
        <table className="w-full border-collapse mb-3 text-[10px]">
          <thead>
            <tr>
              <th className="border border-black bg-gray-100 p-1 text-center text-[9px] w-[30px]">
                Р.б
              </th>
              <th className="border border-black bg-gray-100 p-1 text-center text-[9px]">
                Опис
              </th>
              <th className="border border-black bg-gray-100 p-1 text-center text-[9px] w-[35px]">
                Е М
              </th>
              <th className="border border-black bg-gray-100 p-1 text-center text-[9px] w-[60px]">
                Количина
              </th>
              <th className="border border-black bg-gray-100 p-1 text-center text-[9px] w-[75px]">
                Цена без данок
              </th>
              <th className="border border-black bg-gray-100 p-1 text-center text-[9px] w-[45px]">
                Рабат %
              </th>
              <th className="border border-black bg-gray-100 p-1 text-center text-[9px] w-[60px]">
                Рабат
              </th>
              <th className="border border-black bg-gray-100 p-1 text-center text-[9px] w-[40px]">
                ДДВ %
              </th>
              <th className="border border-black bg-gray-100 p-1 text-center text-[9px] w-[80px]">
                Износ со ДДВ
              </th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, i) => {
              const { discountAmount, totalWithVat: itemTotal } =
                calcLineItem(item);
              return (
                <tr key={i}>
                  <td className="border border-black p-1 text-center">
                    {i + 1}.
                  </td>
                  <td className="border border-black p-1 whitespace-pre-wrap">
                    {item.description}
                  </td>
                  <td className="border border-black p-1 text-center">
                    {item.unit}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {fmt(item.quantity)}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {fmt(item.priceWithoutTax)}
                  </td>
                  <td className="border border-black p-1 text-center">
                    {item.discountPercent}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {fmt(discountAmount)}
                  </td>
                  <td className="border border-black p-1 text-center">
                    {item.vatPercent}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {fmt(itemTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Tariff summary */}
        <table className="border-collapse text-[10px]">
          <thead>
            <tr>
              <th className="border border-black bg-gray-100 p-1 text-[9px]">
                Тарифа
              </th>
              <th className="border border-black bg-gray-100 p-1 text-[9px]">
                Износ без ДДВ
              </th>
              <th className="border border-black bg-gray-100 p-1 text-[9px]">
                ДДВ
              </th>
              <th className="border border-black bg-gray-100 p-1 text-[9px]">
                Износ со ДДВ
              </th>
            </tr>
          </thead>
          <tbody>
            {tariffs.map(([rate, { base, vat, total }]) => (
              <tr key={rate}>
                <td className="border border-black px-2 py-1">{rate}%</td>
                <td className="border border-black px-2 py-1 text-right">
                  {fmt(base)}
                </td>
                <td className="border border-black px-2 py-1 text-right">
                  {fmt(vat)}
                </td>
                <td className="border border-black px-2 py-1 text-right">
                  {fmt(total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ═══ BOTTOM ZONE (pushed to page bottom via mt-auto) ═══ */}
      <div className="mt-auto">
        {/* Totals */}
        <div className="flex justify-end mb-2">
          <table className="text-[11px] border-collapse">
            <tbody>
              <tr>
                <td className="border border-black text-right px-3 py-1">
                  Износ без ДДВ:
                </td>
                <td className="border border-black text-right min-w-[90px] px-3 py-1">
                  {fmt(totalWithoutVat)}
                </td>
              </tr>
              <tr>
                <td className="border border-black text-right px-3 py-1">
                  ДДВ+
                </td>
                <td className="border border-black text-right px-3 py-1">
                  {fmt(totalVat)}
                </td>
              </tr>
              <tr>
                <td className="border border-black text-right px-3 py-1">
                  Вкупен износ со ДДВ
                </td>
                <td className="border border-black text-right px-3 py-1">
                  {fmt(totalWithVat)}
                </td>
              </tr>
              <tr className="text-[13px]">
                <td className="border border-black bg-black text-white font-bold px-3 py-1.5">
                  За наплата
                </td>
                <td className="border border-black font-bold text-right px-3 py-1.5">
                  {fmt(totalWithVat)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Late payment clause */}
        <p className="text-[9px] text-gray-700 mb-3">
          За секое каснење после валутниот рок, засметуваме законска затезна
          камата.
        </p>

        {/* Amount in words */}
        <p className="text-[12px] font-bold mb-6">
          Со зборови: {amountInWords}
        </p>

        {/* Signatures */}
        <div className="flex justify-between">
          <div className="text-center min-w-[180px]">
            <div className="border-t border-black mt-8 pt-1 text-[10px]">
              ПРИМИЛ
            </div>
          </div>
          <div className="text-center min-w-[180px]">
            <div className="border-t border-black mt-8 pt-1 text-[10px]">
              Лице со овластување за потпишување фактури:
              <br />
              {seller.authorizedSigner ?? seller.fullName}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
