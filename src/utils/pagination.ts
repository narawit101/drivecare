export function getPaginationRange(
    currentPage: number,
    totalPages: number,
    siblingCount = 1 // แสดงรอบ currentPage กี่หน้า
): (number | "...")[] {
    const range: (number | "...")[] = [];

    const leftSibling = Math.max(currentPage - siblingCount, 1);
    const rightSibling = Math.min(currentPage + siblingCount, totalPages);

    // หน้าแรก
    if (leftSibling > 1) {
        range.push(1);
    }

    // ...
    if (leftSibling > 2) {
        range.push("...");
    }

    // กลาง
    for (let i = leftSibling; i <= rightSibling; i++) {
        range.push(i);
    }

    // ...
    if (rightSibling < totalPages - 1) {
        range.push("...");
    }

    // หน้าสุดท้าย
    if (rightSibling < totalPages) {
        range.push(totalPages);
    }

    return range;
}
