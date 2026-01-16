# Formatting Equivalency Checklist

## Purpose
This checklist validates that Phase 5 reports achieve visual formatting equivalency with Phase 4 reports. **Focus ONLY on formatting** - content differences are expected and acceptable.

## Prerequisites
1. Run automated tests: `npm run qa:full`
2. Generate QA samples: `npm run generate:qa-samples`
3. Open comparison view: `qa-samples/comparison.html`

## Automated Test Requirements
Before proceeding with manual review, ALL automated tests must pass:

- [ ] `npm run test:formatting` - DOM structure tests
- [ ] `npm run test:css` - CSS usage tests
- [ ] Snapshot tests updated and reviewed

---

## Owner's Report Checklist

### Header Section
| Element | Phase 4 | Phase 5 | Match? |
|---------|---------|---------|--------|
| Company name size | 28px | | ☐ |
| Company name color | BizNavy | | ☐ |
| Subtitle styling | 18px gray | | ☐ |
| Bottom border | 3px solid | | ☐ |

### Health Score Section
| Element | Phase 4 | Phase 5 | Match? |
|---------|---------|---------|--------|
| Section background | Gradient gray | | ☐ |
| Left border accent | 5px colored | | ☐ |
| Score circle shape | 120px round | | ☐ |
| Score circle border | 8px white | | ☐ |
| Score number size | 32px bold | | ☐ |
| Status label | Uppercase | | ☐ |

### Chapter Score Cards
| Element | Phase 4 | Phase 5 | Match? |
|---------|---------|---------|--------|
| Grid layout | 2x2 | | ☐ |
| Card padding | 15-25px | | ☐ |
| Card border-radius | 5-12px | | ☐ |
| Card border | 1px solid | | ☐ |
| Gradient background | By score band | | ☐ |
| White text on cards | Yes | | ☐ |

### Two-Column Layout
| Element | Phase 4 | Phase 5 | Match? |
|---------|---------|---------|--------|
| Column gap | 30px | | ☐ |
| Strengths green accent | Left border | | ☐ |
| Priorities amber accent | Left border | | ☐ |
| Background gradients | Present | | ☐ |

### Quick Wins Section
| Element | Phase 4 | Phase 5 | Match? |
|---------|---------|---------|--------|
| Container border | Green | | ☐ |
| Container background | Light green | | ☐ |
| Item dividers | Bottom border | | ☐ |
| Impact badges | Green pill | | ☐ |

### Executive Recommendation
| Element | Phase 4 | Phase 5 | Match? |
|---------|---------|---------|--------|
| Background | Dark (navy/slate) | | ☐ |
| Text color | White | | ☐ |
| Border radius | 5px | | ☐ |

---

## Comprehensive Report Checklist

### Cover Page
| Element | Phase 4 | Phase 5 | Match? |
|---------|---------|---------|--------|
| Company title | 48px bold | | ☐ |
| Title color | BizNavy | | ☐ |
| Bottom border | 3px solid | | ☐ |
| Metadata box | Gray background | | ☐ |

### Dimension Tables
| Element | Phase 4 | Phase 5 | Match? |
|---------|---------|---------|--------|
| Border radius | 10px | | ☐ |
| Box shadow | Present | | ☐ |
| Header background | BizNavy | | ☐ |
| Header text | White | | ☐ |
| Cell padding | 12-15px | | ☐ |
| Row hover | Light gray | | ☐ |
| Score badges | Pill shape | | ☐ |

### Findings Grid
| Element | Phase 4 | Phase 5 | Match? |
|---------|---------|---------|--------|
| 3-column layout | Yes | | ☐ |
| Card border-radius | 12px | | ☐ |
| Card shadows | Present | | ☐ |
| Strengths gradient | Green | | ☐ |
| Gaps gradient | Amber | | ☐ |
| Risks gradient | Red | | ☐ |
| Left border accent | 5px | | ☐ |

### Timeline/Roadmap
| Element | Phase 4 | Phase 5 | Match? |
|---------|---------|---------|--------|
| Phase card border | 2px solid | | ☐ |
| Phase card radius | 12px | | ☐ |
| Header background | BizGreen | | ☐ |
| Header text | White | | ☐ |
| Header negative margin | Yes | | ☐ |
| Action list bullets | Arrow (▶) | | ☐ |

### Risk Matrix
| Element | Phase 4 | Phase 5 | Match? |
|---------|---------|---------|--------|
| 3-column grid | Yes | | ☐ |
| Item background | White | | ☐ |
| Left border | 5px red | | ☐ |
| Border radius | 0 10px 10px 0 | | ☐ |
| Box shadow | Present | | ☐ |

### Financial Projections
| Element | Phase 4 | Phase 5 | Match? |
|---------|---------|---------|--------|
| Background | Dark gradient | | ☐ |
| Text color | White | | ☐ |
| 4-column grid | Yes | | ☐ |
| Value size | 28px | | ☐ |
| Border radius | 12px | | ☐ |

---

## Global Elements

### Typography
| Element | Expected | Phase 5 | Match? |
|---------|----------|---------|--------|
| H1 | 32px Montserrat | | ☐ |
| H2 | 24px Montserrat | | ☐ |
| H3 | 20px Montserrat | | ☐ |
| Body | 16px Open Sans | | ☐ |
| Line height | 1.6 | | ☐ |

### Brand Colors
| Color | Hex | Used Correctly? |
|-------|-----|-----------------|
| BizNavy | #212653 | ☐ |
| BizGreen | #969423 | ☐ |
| Excellence | #28a745 | ☐ |
| Proficiency | #0d6efd | ☐ |
| Attention | #ffc107 | ☐ |
| Critical | #dc3545 | ☐ |

### PDF Export
| Aspect | Pass? |
|--------|-------|
| Page breaks at sections | ☐ |
| Colors render correctly | ☐ |
| Tables don't break mid-row | ☐ |
| Margins consistent | ☐ |
| No content cutoff | ☐ |

---

## Sign-Off

### Automated Tests
- [ ] All DOM structure tests pass
- [ ] All CSS usage tests pass
- [ ] Snapshots reviewed and approved

### Manual Review
- [ ] Owner's Report checklist complete
- [ ] Comprehensive Report checklist complete
- [ ] No critical formatting differences found

### Acceptable Variances
Document any minor differences that are acceptable:
1.
2.
3.

### Critical Issues Found
Document any issues that must be fixed:
1.
2.
3.

---

**Reviewer:** _______________
**Date:** _______________
**Result:** ☐ APPROVED  ☐ REQUIRES FIXES

---

## Quick Reference Commands

```bash
# Full QA pipeline
npm run qa:full

# Individual test commands
npm run test:formatting        # DOM structure tests
npm run test:css               # CSS usage tests
npm run test:formatting:watch  # Watch mode for development

# Generate fixtures
npm run generate:test-reports  # Generate Phase 5 HTML fixtures
npm run generate:qa-samples    # Generate comparison files

# Update snapshots after intentional changes
npm run test:formatting:update-snapshots
```

## File Locations

- **Test helpers:** `src/qa/helpers/`
- **Test files:** `src/qa/__tests__/`
- **Fixtures:** `src/qa/fixtures/`
- **Phase 4 reference:** `src/qa/fixtures/phase4/`
- **Phase 5 generated:** `src/qa/fixtures/phase5/`
- **QA samples output:** `qa-samples/`
