export const validateMenuItem = (item: { name?: string; price?: number; category?: string; costPrice?: number }) => {
  const errors: Record<string, string> = {};
  
  if (!item.name || item.name.trim().length < 3) {
    errors.name = "O nome deve ter pelo menos 3 caracteres.";
  }
  
  if (item.price === undefined || item.price <= 0) {
    errors.price = "O preço deve ser maior que zero.";
  }

  if (item.costPrice !== undefined && item.costPrice < 0) {
    errors.costPrice = "O preço de custo não pode ser negativo.";
  }
  
  if (!item.category) {
    errors.category = "Selecione uma categoria.";
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateCategory = (category: { name?: string; description?: string }) => {
  const errors: Record<string, string> = {};
  
  if (!category.name || category.name.trim().length < 2) {
    errors.name = "O nome deve ter pelo menos 2 caracteres.";
  }
  
  if (!category.description || category.description.trim().length < 5) {
    errors.description = "A descrição deve ter pelo menos 5 caracteres.";
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
