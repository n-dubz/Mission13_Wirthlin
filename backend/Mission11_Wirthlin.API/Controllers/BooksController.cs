using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mission11_Wirthlin.API.Data;      // Or your actual namespace for BookstoreContext
using Mission11_Wirthlin.API.Models;   // Or your actual namespace for Book model
using System.Linq;

namespace Mission11_Wirthlin.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BooksController : ControllerBase
    {
        private readonly BookstoreContext _context;
        private readonly ILogger<BooksController> _logger;

        public BooksController(BookstoreContext context, ILogger<BooksController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> Get(
            int pageNumber = 1,
            int pageSize = 10,
            string sortField = "title",
            string sortOrder = "asc",
            string? category = null)
        {
            try
            {
                var query = _context.Books.AsQueryable();

                // Apply category filter if specified
                if (!string.IsNullOrEmpty(category))
                {
                    query = query.Where(b => b.Category == category);
                }

                // Apply sorting
                query = sortOrder.ToLower() == "desc"
                    ? sortField.ToLower() switch
                    {
                        "author" => query.OrderByDescending(b => b.Author),
                        "publisher" => query.OrderByDescending(b => b.Publisher),
                        "isbn" => query.OrderByDescending(b => b.ISBN),
                        "classification" => query.OrderByDescending(b => b.Classification),
                        "category" => query.OrderByDescending(b => b.Category),
                        "pagecount" => query.OrderByDescending(b => b.PageCount),
                        "price" => query.OrderByDescending(b => b.Price),
                        _ => query.OrderByDescending(b => b.Title)
                    }
                    : sortField.ToLower() switch
                    {
                        "author" => query.OrderBy(b => b.Author),
                        "publisher" => query.OrderBy(b => b.Publisher),
                        "isbn" => query.OrderBy(b => b.ISBN),
                        "classification" => query.OrderBy(b => b.Classification),
                        "category" => query.OrderBy(b => b.Category),
                        "pagecount" => query.OrderBy(b => b.PageCount),
                        "price" => query.OrderBy(b => b.Price),
                        _ => query.OrderBy(b => b.Title)
                    };

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

                var books = await query
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return Ok(new
                {
                    Data = books,
                    TotalCount = totalCount,
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    TotalPages = totalPages
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching books");
                return StatusCode(500, "An error occurred while fetching books");
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var book = await _context.Books.FindAsync(id);
                if (book == null)
                {
                    return NotFound();
                }

                return Ok(book);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching book with ID {Id}", id);
                return StatusCode(500, "An error occurred while fetching the book");
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Book book)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                _context.Books.Add(book);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetById), new { id = book.BookID }, book);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating book");
                return StatusCode(500, "An error occurred while creating the book");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Book book)
        {
            try
            {
                if (id != book.BookID)
                {
                    return BadRequest("ID mismatch");
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                _context.Entry(book).State = EntityState.Modified;

                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!await _context.Books.AnyAsync(b => b.BookID == id))
                    {
                        return NotFound();
                    }
                    throw;
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating book with ID {Id}", id);
                return StatusCode(500, "An error occurred while updating the book");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var book = await _context.Books.FindAsync(id);
                if (book == null)
                {
                    return NotFound();
                }

                _context.Books.Remove(book);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting book with ID {Id}", id);
                return StatusCode(500, "An error occurred while deleting the book");
            }
        }

        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            try
            {
                var categories = await _context.Books
                    .Select(b => b.Category)
                    .Distinct()
                    .OrderBy(c => c)
                    .ToListAsync();

                return Ok(categories);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching categories");
                return StatusCode(500, "An error occurred while fetching categories");
            }
        }
    }
}
