import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import type { ApiError } from "@/lib/api-client";
import { applyFieldErrors, generalErrorMessage } from "@/lib/formErrors";

import { useBook, useBookCategoryList, useCreateBook, useUpdateBook } from "./useLibraryCrud";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  isbn: z.string(),
  author: z.string(),
  publisher: z.string(),
  category: z.string(),
  description: z.string(),
});

type FormValues = z.infer<typeof schema>;

const EMPTY_VALUES: FormValues = { title: "", isbn: "", author: "", publisher: "", category: "", description: "" };
const FIELD_KEYS = new Set(["title", "isbn", "author", "publisher", "category", "description"]);

export function BookFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: book, isLoading: isLoadingBook } = useBook(id);
  const { data: categories } = useBookCategoryList({ page_size: 100 });
  const createBook = useCreateBook();
  const updateBook = useUpdateBook(id ?? "");
  const mutation = isEditMode ? updateBook : createBook;
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY_VALUES });

  useEffect(() => {
    if (book) {
      reset({
        title: book.title,
        isbn: book.isbn,
        author: book.author,
        publisher: book.publisher,
        category: book.category ?? "",
        description: book.description,
      });
    }
  }, [book, reset]);

  const onSubmit = (values: FormValues) => {
    setGeneralError(null);
    mutation.mutate(
      {
        title: values.title,
        isbn: values.isbn || undefined,
        author: values.author || undefined,
        publisher: values.publisher || undefined,
        category: values.category || undefined,
        description: values.description || undefined,
      },
      {
        onSuccess: () => {
          showToast({ title: isEditMode ? "Book updated" : "Book created" });
          navigate("/library/books");
        },
        onError: (err: ApiError) => {
          if (!applyFieldErrors(err, setError, FIELD_KEYS)) {
            const message = generalErrorMessage(err);
            setGeneralError(message);
            showToast({ title: "Could not save book", description: message, tone: "danger" });
          }
        },
      },
    );
  };

  if (isEditMode && isLoadingBook) {
    return <FullPageSpinner />;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-[var(--color-text)]">{isEditMode ? "Edit book" : "New book"}</h1>

      <Card>
        <CardHeader>
          <CardTitle>Book details</CardTitle>
        </CardHeader>
        <CardContent>
          {generalError && (
            <Alert tone="danger" className="mb-4">
              {generalError}
            </Alert>
          )}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <Input label="Title" error={errors.title?.message} {...register("title")} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Author" error={errors.author?.message} {...register("author")} />
              <Input label="ISBN" error={errors.isbn?.message} {...register("isbn")} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Publisher" error={errors.publisher?.message} {...register("publisher")} />
              <Select label="Category" error={errors.category?.message} {...register("category")}>
                <option value="">Not set</option>
                {categories?.results.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>
            <Input label="Description" error={errors.description?.message} {...register("description")} />

            <div className="mt-2 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => navigate("/library/books")}>
                Cancel
              </Button>
              <Button type="submit" isLoading={mutation.isPending}>
                {!mutation.isPending && <Save className="size-4" aria-hidden="true" />}
                Save
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
