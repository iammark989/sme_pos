<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class InventoryStocksExport implements FromArray, WithHeadings, WithColumnFormatting
{
    public function __construct(
        private array $stocks
    ) {}

    public function headings(): array
    {
        return [
            'SKU',
            'Item',
            'Warehouse',
            'Branch',
            'Quantity',
            'UOM',
            'Reorder Level',
            'Status',
        ];
    }

    public function array(): array
    {
        return array_map(function (array $row) {
            return [
                $row['sku'] ?? '',
                $row['item'] ?? '',
                $row['warehouse'] ?? '',
                $row['branch'] ?? '',
                (float) ($row['quantity'] ?? 0),
                $row['uom'] ?? '',
                (float) ($row['reorder_level'] ?? 0),
                $row['status'] ?? '',
            ];
        }, $this->stocks);
    }

    public function columnFormats(): array
    {
        return [
            'E' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'G' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
        ];
    }
}