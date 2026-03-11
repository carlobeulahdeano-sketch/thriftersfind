const fs = require('fs');

function fixInventoryActions() {
    const file = './src/app/(app)/inventory/actions.ts';
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    let orig = content;
    
    // Fix map product id
    content = content.replace(/id: product\.id/g, 'id: String(product.id)');
    
    // branchId: user?.branchId || null
    // error TS2322: Type 'string | number' is not assignable to type 'number | null | undefined'
    content = content.replace(/branchId: user\?\.branchId \|\| null/g, 'branchId: user?.branchId ? Number(user.branchId) : null');

    if (content !== orig) {
        fs.writeFileSync(file, content);
        console.log("Fixed inventory/actions.ts");
    }
}

function fixCategoryActions() {
    const file = './src/app/(app)/inventory/category-actions.ts';
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    let orig = content;
    
    content = content.replace(/NOT: \{ id \}/g, 'NOT: { id: Number(id) }');
    content = content.replace(/where: \{ id \}/g, 'where: { id: Number(id) }');

    if (content !== orig) {
        fs.writeFileSync(file, content);
        console.log("Fixed inventory/category-actions.ts");
    }
}

fixInventoryActions();
fixCategoryActions();
