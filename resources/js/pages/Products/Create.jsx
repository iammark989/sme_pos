import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';

const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

const emptyRecipe = () => ({
    inventory_item_id: '',
    quantity: '1',
});

export default function Create() {
    const [categories, setCategories] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);

    const [loadingOptions, setLoadingOptions] = useState(true);
    const [loadingError, setLoadingError] = useState('');
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [errorMessage, setErrorMessage] = useState('');

    const [form, setForm] = useState({
        category_id: '',
        name: '',
        sku: '',
        description: '',
        selling_price: '',
        is_active: true,
        recipes: [emptyRecipe()],
    });

    useEffect(() => {
        const loadOptions = async () => {
            setLoadingOptions(true);
            setLoadingError('');

            try {
                const [categoryResponse, itemResponse] = await Promise.all([
                    axios.get('/api/product-categories'),
                    axios.get('/api/inventory-items'),
                ]);

                const categoryData = categoryResponse.data.data ?? [];
                const itemResult = itemResponse.data.data;
                const itemData = Array.isArray(itemResult)
                    ? itemResult
                    : itemResult?.data ?? [];

                setCategories(categoryData);
                setInventoryItems(itemData);

                if (categoryData.length === 0) {
                    setLoadingError(
                        'No active categories are available. Create or activate a category first.',
                    );
                } else if (itemData.length === 0) {
                    setLoadingError(
                        'No active inventory items are available. Create or activate an inventory item first.',
                    );
                }
            } catch (error) {
                console.error('Failed to load product form options:', error);

                setLoadingError(
                    error.response?.data?.message ||
                        'Failed to load categories and inventory items.',
                );
            } finally {
                setLoadingOptions(false);
            }
        };

        loadOptions();
    }, []);

    const updateField = (field, value) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const updateRecipe = (index, field, value) => {
        setForm((current) => ({
            ...current,
            recipes: current.recipes.map((recipe, recipeIndex) =>
                recipeIndex === index
                    ? { ...recipe, [field]: value }
                    : recipe,
            ),
        }));
    };

    const addRecipe = () => {
        setForm((current) => ({
            ...current,
            recipes: [...current.recipes, emptyRecipe()],
        }));
    };

    const removeRecipe = (index) => {
        setForm((current) => ({
            ...current,
            recipes: current.recipes.filter(
                (_, recipeIndex) => recipeIndex !== index,
            ),
        }));

        setErrors((current) => {
            const next = { ...current };

            Object.keys(next).forEach((key) => {
                if (key.startsWith('recipes.')) {
                    delete next[key];
                }
            });

            return next;
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setSaving(true);
        setErrors({});
        setErrorMessage('');

        const payload = {
            category_id: Number(form.category_id),
            name: form.name.trim(),
            sku: form.sku.trim(),
            description: form.description.trim() || null,
            selling_price: form.selling_price,
            is_active: form.is_active,
            recipes: form.recipes.map((recipe) => ({
                inventory_item_id: Number(recipe.inventory_item_id),
                quantity: recipe.quantity,
            })),
        };

        try {
            await axios.post('/api/product-management', payload);

            router.visit('/products');
        } catch (error) {
            console.error('Failed to create product:', error);

            if (error.response?.status === 422) {
                setErrors(error.response.data.errors ?? {});
                setErrorMessage(
                    error.response.data.message ||
                        'Please check the form fields.',
                );
            } else {
                setErrorMessage(
                    error.response?.data?.message ||
                        'Failed to create product. Please try again.',
                );
            }
        } finally {
            setSaving(false);
        }
    };

    const selectedInventoryItemIds = form.recipes
        .map((recipe) => recipe.inventory_item_id)
        .filter(Boolean);

    const getRecipeError = (index, field) =>
        errors[`recipes.${index}.${field}`]?.[0];

    return (
        <AuthenticatedLayout>
            <div className="p-6">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Create Product
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Configure product details, pricing, and recipe ingredients.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => router.visit('/products')}
                        className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Back to Products
                    </button>
                </div>

                {loadingError && (
                    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        {loadingError}
                    </div>
                )}

                {errorMessage && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-5 text-lg font-semibold text-gray-900">
                            Product Information
                        </h2>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Product Name
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(event) =>
                                        updateField('name', event.target.value)
                                    }
                                    required
                                    maxLength={255}
                                    className={inputClass}
                                    placeholder="e.g. Regular Fries"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.name[0]}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    SKU
                                </label>
                                <input
                                    type="text"
                                    value={form.sku}
                                    onChange={(event) =>
                                        updateField('sku', event.target.value)
                                    }
                                    required
                                    maxLength={255}
                                    className={inputClass}
                                    placeholder="e.g. FRIES-REG"
                                />
                                {errors.sku && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.sku[0]}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Category
                                </label>
                                <select
                                    value={form.category_id}
                                    onChange={(event) =>
                                        updateField('category_id', event.target.value)
                                    }
                                    required
                                    disabled={loadingOptions || categories.length === 0}
                                    className={inputClass}
                                >
                                    <option value="">Select category</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.category_id && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.category_id[0]}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Selling Price (PHP)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.selling_price}
                                    onChange={(event) =>
                                        updateField('selling_price', event.target.value)
                                    }
                                    required
                                    className={inputClass}
                                    placeholder="0.00"
                                />
                                {errors.selling_price && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.selling_price[0]}
                                    </p>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Description
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={(event) =>
                                        updateField('description', event.target.value)
                                    }
                                    rows={3}
                                    className={inputClass}
                                    placeholder="Optional product description"
                                />
                                {errors.description && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.description[0]}
                                    </p>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={form.is_active}
                                        onChange={(event) =>
                                            updateField('is_active', event.target.checked)
                                        }
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    Active product
                                </label>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Recipe Ingredients
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Specify the inventory quantity consumed when one product is sold.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={addRecipe}
                                disabled={loadingOptions || inventoryItems.length === 0}
                                className="cursor-pointer rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Add Ingredient
                            </button>
                        </div>

                        {errors.recipes && (
                            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                {errors.recipes[0]}
                            </div>
                        )}

                        {form.recipes.map((recipe, index) => {
                            const selectedItem = inventoryItems.find(
                                (item) =>
                                    String(item.id) ===
                                    String(recipe.inventory_item_id),
                            );

                            return (
                                <div
                                    key={index}
                                    className="mb-4 rounded-lg border border-gray-200 p-4 last:mb-0"
                                >
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-gray-800">
                                            Ingredient {index + 1}
                                        </h3>

                                        {form.recipes.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeRecipe(index)}
                                                className="cursor-pointer text-sm font-medium text-red-600 hover:text-red-800"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                                Inventory Item
                                            </label>
                                            <select
                                                value={recipe.inventory_item_id}
                                                onChange={(event) =>
                                                    updateRecipe(
                                                        index,
                                                        'inventory_item_id',
                                                        event.target.value,
                                                    )
                                                }
                                                required
                                                disabled={
                                                    loadingOptions ||
                                                    inventoryItems.length === 0
                                                }
                                                className={inputClass}
                                            >
                                                <option value="">
                                                    Select ingredient
                                                </option>

                                                {inventoryItems.map((item) => {
                                                    const alreadySelected =
                                                        selectedInventoryItemIds.includes(
                                                            String(item.id),
                                                        ) &&
                                                        String(item.id) !==
                                                            String(recipe.inventory_item_id);

                                                    return (
                                                        <option
                                                            key={item.id}
                                                            value={item.id}
                                                            disabled={alreadySelected}
                                                        >
                                                            {item.name} ({item.sku})
                                                        </option>
                                                    );
                                                })}
                                            </select>

                                            {getRecipeError(
                                                index,
                                                'inventory_item_id',
                                            ) && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {getRecipeError(
                                                        index,
                                                        'inventory_item_id',
                                                    )}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                                Quantity per Product
                                                {selectedItem?.uom?.abbreviation
                                                    ? ` (${selectedItem.uom.abbreviation})`
                                                    : ''}
                                            </label>
                                            <input
                                                type="number"
                                                min="0.001"
                                                step="0.001"
                                                value={recipe.quantity}
                                                onChange={(event) =>
                                                    updateRecipe(
                                                        index,
                                                        'quantity',
                                                        event.target.value,
                                                    )
                                                }
                                                required
                                                className={inputClass}
                                                placeholder="e.g. 1.000"
                                            />

                                            {getRecipeError(index, 'quantity') && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {getRecipeError(index, 'quantity')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </section>

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => router.visit('/products')}
                            disabled={saving}
                            className="cursor-pointer rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                saving ||
                                loadingOptions ||
                                categories.length === 0 ||
                                inventoryItems.length === 0
                            }
                            className="cursor-pointer rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? 'Creating Product...' : 'Create Product'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}