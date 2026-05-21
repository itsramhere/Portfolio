document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Intersection Observer for scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: stop observing once it's visible
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements with animation classes
    document.querySelectorAll('.fade-in, .slide-up').forEach((el) => {
        observer.observe(el);
    });
    
    // Trigger hero animation immediately
    setTimeout(() => {
        const hero = document.querySelector('.hero');
        if (hero) hero.classList.add('visible');
    }, 100);

    // Fetch blogs if on homepage
    const blogList = document.getElementById('blog-list');
    if (blogList) {
        fetch('/api/blogs')
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    blogList.innerHTML = `<p style="color:red;">Database Error: ${data.error}</p>`;
                } else if (data.blogs && data.blogs.length > 0) {
                    blogList.innerHTML = '';
                    const latestBlogs = data.blogs.slice(0, 3);
                    latestBlogs.forEach(blog => {
                        const article = document.createElement('article');
                        article.className = 'blog-item';
                        article.innerHTML = `
                            <span class="blog-date">${blog.date}</span>
                            <h3><a href="blog.html?id=${blog.id}">${blog.title}</a></h3>
                        `;
                        blogList.appendChild(article);
                    });
                } else {
                    blogList.innerHTML = '<p>No blogs published yet.</p>';
                }
            })
            .catch(err => {
                console.error(err);
                blogList.innerHTML = '<p>Error loading blogs.</p>';
            });
    }

    // Fetch all blogs for the blogs.html page
    const allBlogList = document.getElementById('all-blog-list');
    if (allBlogList) {
        fetch('/api/blogs')
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    allBlogList.innerHTML = `<p style="color:red;">Database Error: ${data.error}</p>`;
                } else if (data.blogs && data.blogs.length > 0) {
                    allBlogList.innerHTML = '';
                    data.blogs.forEach(blog => {
                        const article = document.createElement('article');
                        article.className = 'blog-item';
                        article.innerHTML = `
                            <span class="blog-date">${blog.date}</span>
                            <h3><a href="blog.html?id=${blog.id}">${blog.title}</a></h3>
                        `;
                        allBlogList.appendChild(article);
                    });
                } else {
                    allBlogList.innerHTML = '<p>No blogs published yet.</p>';
                }
            })
            .catch(err => {
                console.error(err);
                allBlogList.innerHTML = '<p>Error loading blogs.</p>';
            });
    }
});
