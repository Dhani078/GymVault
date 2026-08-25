---
name: typescript-strict-patterns
description: Standar penulisan TypeScript strict mode, Zod runtime schema validation, interface contract, generic types, dan error handling aman untuk aplikasi Next.js App Router dan Supabase.
---

# TypeScript Strict Patterns Skill

> Penulisan kode type-safe, Zod schema validation, dan error handling tanpa runtime crash.

## 1. Principles
- **No `any` Types**: Gunakan `unknown` dengan type narrowing atau Zod schema validation.
- **Explicit Interfaces**: Definisikan interface data untuk setiap props, database rows, dan API payloads.
- **Server Action / API Validation**: Gunakan Zod untuk validasi input form sebelum data masuk ke database Supabase.

## 2. Example: Zod Contact Schema
```ts
import { z } from 'zod';

export const ContactFormSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  email: z.string().email('Format email tidak valid'),
  message: z.string().min(10, 'Pesan minimal 10 karakter').max(2000),
  website: z.string().max(0).optional(), // Honeypot
});

export type ContactFormData = z.infer<typeof ContactFormSchema>;
```
