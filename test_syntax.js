const blog = {cover_image: 'xyz'};
const html = `
    ${blog.cover_image ? \`<img src="\${blog.cover_image}" alt="Cover Image" class="blog-hero-image">\` : ''}
`;
console.log(html);
