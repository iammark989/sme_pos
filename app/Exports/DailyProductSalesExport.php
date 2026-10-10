<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class DailyProductSalesExport implements FromArray, WithHeadings, WithColumnFormatting
{
    public function __construct(
        private array $products
    ) {}

    public function headings(): array
    {
        return [
            'SKU',
            'Product Name',
            'Quantity Sold',
            'Gross Sales',
        ];
    }

    public function array(): array
    {
        return array_map(
            fn (array $product) => [
                $product['sku'] ?? '',
                $product['product_name'] ?? '',
                (float) $product['quantity_sold'],
                (float) $product['gross_sales'],
            ],
            $this->products
        );
    }

    public function columnFormats(): array
    {
        return [
            'C' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'D' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
        ];
    }
}