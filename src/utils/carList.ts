import carListData from './car-list.json';

export type CarBrand = {
    name: string;
    models: string[];
};

export type CarListData = {
    brands: CarBrand[];
};

export function getCarBrands(): string[] {
    return carListData.brands.map((brand) => brand.name);
}

export function getCarModelsByBrand(brandName: string): string[] {
    const brand = carListData.brands.find(
        (b) => b.name.toLowerCase() === brandName.toLowerCase()
    );
    return brand?.models || [];
}

export function getCarListData(): CarListData {
    return carListData;
}

