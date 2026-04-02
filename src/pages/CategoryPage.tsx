import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProductsByLevel3Category, getProductsByParentCategory, getCategoryById } from '../services/categoryService'
import { productListPrice, productSalePrice } from '../utils/productPrice'
import { supabase } from '../services/supabase'
import { Product } from '../types'

const CategoryPage: React.FC = () => {
    const { categoryId, category } = useParams<{ categoryId: string; category: string }>()
    const actualCategoryId = categoryId || category
    const [products, setProducts] = useState<Product[]>([])
    const [allProducts, setAllProducts] = useState<Product[]>([]) // 모든 상품 저장
    const [categoryName, setCategoryName] = useState<string>('')
    const [subcategories, setSubcategories] = useState<any[]>([])
    const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(null)
    const [subcategoryProductCounts, setSubcategoryProductCounts] = useState<{[key: number]: number}>({})
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string>('')
    const navigate = useNavigate()

    useEffect(() => {
        const fetchProducts = async () => {
            if (!actualCategoryId) return

            try {
                setLoading(true)
                setError('')
                
                // 먼저 카테고리 정보를 가져와서 레벨 확인
                const categoryInfo = await getCategoryById(parseInt(actualCategoryId))
                
                if (!categoryInfo) {
                    setError('카테고리를 찾을 수 없습니다.')
                    return
                }

                // 레벨에 따라 다른 함수 호출
                if (categoryInfo.level === 3) {
                    // 레벨3 카테고리인 경우 (최하위 카테고리)
                    const result = await getProductsByLevel3Category(parseInt(actualCategoryId))
                    setProducts(result.products)
                    setCategoryName(result.categoryName)
                    setSubcategories([])
                } else {
                    // 레벨1 또는 레벨2 카테고리인 경우 (상위 카테고리)
                    const result = await getProductsByParentCategory(parseInt(actualCategoryId))
                    setProducts(result.products)
                    setAllProducts(result.products) // 모든 상품 저장
                    setCategoryName(result.categoryName)
                    setSubcategories(result.subcategories)
                    
                    // 하위 카테고리별 상품 개수 계산
                    if (result.subcategories.length > 0) {
                        await calculateSubcategoryProductCounts(result.subcategories, result.products)
                    }
                }
            } catch (err) {
                console.error('Error fetching category products:', err)
                setError('상품을 불러오는 중 오류가 발생했습니다.')
            } finally {
                setLoading(false)
            }
        }

        fetchProducts()
    }, [actualCategoryId])

    // 하위 카테고리별 상품 개수 계산
    const calculateSubcategoryProductCounts = async (subcategories: any[], allProducts: Product[]) => {
        const counts: {[key: number]: number} = {}
        
        for (const subcategory of subcategories) {
            try {
                // 선택된 카테고리의 모든 하위 카테고리 ID들을 가져오기
                const { data: subcategoryIds, error } = await supabase.rpc('get_all_subcategory_ids', {
                    parent_id: subcategory.id
                })
                
                if (error) {
                    console.error('Error getting subcategory IDs for count:', error)
                    // 에러 시 해당 카테고리 ID만으로 계산
                    counts[subcategory.id] = allProducts.filter(product => product.category_id === subcategory.id).length
                } else {
                    // 선택된 카테고리 ID와 그 하위 카테고리 ID들을 모두 포함
                    const allIds = [subcategory.id, ...(subcategoryIds || [])]
                    counts[subcategory.id] = allProducts.filter(product => allIds.includes(product.category_id)).length
                }
            } catch (error) {
                console.error('Error calculating subcategory product count:', error)
                counts[subcategory.id] = allProducts.filter(product => product.category_id === subcategory.id).length
            }
        }
        
        setSubcategoryProductCounts(counts)
    }

    // 하위 카테고리 필터링 함수
    const handleSubcategoryFilter = async (subcategoryId: number | null) => {
        setSelectedSubcategory(subcategoryId)
        
        if (subcategoryId === null) {
            // 전체 상품 표시
            setProducts(allProducts)
        } else {
            // 특정 하위 카테고리와 그 하위의 모든 카테고리 상품들을 필터링
            try {
                // 선택된 카테고리의 모든 하위 카테고리 ID들을 가져오기
                const { data: subcategoryIds, error } = await supabase.rpc('get_all_subcategory_ids', {
                    parent_id: subcategoryId
                })
                
                if (error) {
                    console.error('Error getting subcategory IDs:', error)
                    // 에러 시 해당 카테고리 ID만으로 필터링
                    const filteredProducts = allProducts.filter(product => product.category_id === subcategoryId)
                    setProducts(filteredProducts)
                    return
                }
                
                // 선택된 카테고리 ID와 그 하위 카테고리 ID들을 모두 포함
                const allIds = [subcategoryId, ...(subcategoryIds || [])]
                const filteredProducts = allProducts.filter(product => allIds.includes(product.category_id))
                setProducts(filteredProducts)
            } catch (error) {
                console.error('Error in handleSubcategoryFilter:', error)
                // 에러 시 해당 카테고리 ID만으로 필터링
                const filteredProducts = allProducts.filter(product => product.category_id === subcategoryId)
                setProducts(filteredProducts)
            }
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
                    <p className="text-gray-600">상품을 불러오는 중...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                    >
                        다시 시도
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* 헤더 */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{categoryName}</h1>
                    <p className="text-gray-600">총 {products.length}개의 상품</p>
                </div>

                {/* 하위 카테고리 필터 */}
                {subcategories.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">하위 카테고리</h2>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => handleSubcategoryFilter(null)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                    selectedSubcategory === null
                                        ? 'bg-gray-800 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                전체 ({allProducts.length})
                            </button>
                            {subcategories.map((subcategory) => {
                                const subcategoryProductCount = subcategoryProductCounts[subcategory.id] || 0
                                
                                return (
                                    <button
                                        key={subcategory.id}
                                        onClick={() => handleSubcategoryFilter(subcategory.id)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                            selectedSubcategory === subcategory.id
                                                ? 'bg-gray-800 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        {subcategory.name} ({subcategoryProductCount})
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* 상품 목록 */}
                {products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product) => {
                            const listPx = productListPrice(product)
                            const salePx = productSalePrice(product)
                            return (
                            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                                <div className="aspect-w-1 aspect-h-1 w-full">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-48 object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.src = '/placeholder-image.jpg'
                                        }}
                                    />
                                </div>
                                <div className="p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                                        {product.name}
                                    </h3>
                                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                                        {product.description}
                                    </p>
                                    <div className="flex justify-between items-center">
                                        <span className="flex flex-wrap items-baseline gap-2">
                                            {listPx != null && (
                                                <span className="text-sm text-gray-400 line-through">
                                                    ₩{listPx.toLocaleString()}
                                                </span>
                                            )}
                                            <span className="text-xl font-bold text-gray-900">
                                                ₩{salePx.toLocaleString()}
                                            </span>
                                        </span>
                                        <button 
                                            onClick={() => navigate(`/product/${product.id}`)}
                                            className="bg-gray-800 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
                                        >
                                            상세보기
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-6xl mb-4">📦</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">상품이 없습니다</h3>
                        <p className="text-gray-600">이 카테고리에는 아직 상품이 등록되지 않았습니다.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default CategoryPage

