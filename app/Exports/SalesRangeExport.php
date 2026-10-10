<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class SalesRangeExport implements FromArray, WithHeadings, WithColumnFormatting
{
    public function __construct(
        private array $dailySales
    ) {}

    public function headings(): array
    {
        return [
            'Date',
            'Transactions',
            'Gross Sales',
            'Discounts',
            'Net Sales',
        ];
    }

    public function array(): array
    {
        return array_map(
            fn (array $day) => [
                $day['date'],
                (int) $day['transaction_count'],
                (float) $day['gross_sales'],
                (float) $day['discounts'],
                (float) $day['net_sales'],
            ],
            $this->dailySales
        );
    }

    public function columnFormats(): array
    {
        return [
            'C' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'D' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'E' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
        ];
    }
}