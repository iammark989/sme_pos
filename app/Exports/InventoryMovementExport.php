<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithHeadings;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class InventoryMovementExport implements FromArray, WithHeadings, WithColumnFormatting
{
    public function __construct(private array $transactions)
    {
    }

    public function headings(): array
    {
        return [
            'Date',
            'SKU',
            'Item',
            'Transaction Category',
            'Transaction Type',
            'Quantity',
            'Warehouse',
            'Related Warehouse',
            'Reference',
        ];
    }

    public function array(): array
    {
        return array_map(function (array $row) {
            return [
                $row['date'] ?? '',
                $row['sku'] ?? '',
                $row['item'] ?? '',
                $row['transaction_category'] ?? '',
                $row['type'] ?? '',
                (float) ($row['quantity'] ?? 0),
                $row['warehouse'] ?? '',
                $row['related_warehouse'] ?? '',
                $row['reference'] ?? '',
            ];
        }, $this->transactions);
    }

    public function columnFormats(): array
    {
        return [
            'F' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
        ];
    }
}