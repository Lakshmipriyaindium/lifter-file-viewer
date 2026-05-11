"use client"
import * as React from "react"
import type { ControllerProps, FieldPath, FieldValues, UseFormReturn } from "react-hook-form"
import { Controller, FormProvider, useFormContext } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

type FormProps<TFieldValues extends FieldValues = FieldValues, TContext = unknown> = React.PropsWithChildren<{
  form: UseFormReturn<TFieldValues, TContext>
}> & React.FormHTMLAttributes<HTMLFormElement>

/**
 * A form component that integrates with react-hook-form.
 */
const Form = <TFieldValues extends FieldValues = FieldValues, TContext = unknown>({
  form,
  children,
  className,
  ...props
}: FormProps<TFieldValues, TContext>) => {
  return (
    <FormProvider {...form}>
      <form
        className={className}
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit((data) => {
            if (props.onSubmit) {
              props.onSubmit(data as unknown as React.FormEvent<HTMLFormElement>);
            }
          })(e);
        }}
        {...props}
      >
        {children}
      </form>
    </FormProvider>
  )
}

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

type FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
  control?: ControllerProps<TFieldValues, TName>["control"]
  render: (props: { field: Parameters<ControllerProps<TFieldValues, TName>["render"]>[0]["field"]; formState: Parameters<ControllerProps<TFieldValues, TName>["render"]>[0]["formState"] }) => React.ReactNode
}

/**
 * A field component that integrates with react-hook-form.
 */
const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  render,
}: FormFieldProps<TFieldValues, TName>) => {
  const form = useFormContext<TFieldValues>()
  const formControl = control || form.control

  return (
    <FormFieldContext.Provider value={{ name }}>
      <Controller
        name={name}
        control={formControl}
        render={({ field, formState }) => {
          const rendered = render({ field, formState });
          if (!React.isValidElement(rendered)) {
            throw new Error("The render function must return a valid React element.");
          }
          return rendered;
        }}
      />
    </FormFieldContext.Provider>
  )
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const form = useFormContext()

  const fieldState = form.getFieldState(fieldContext.name, form.formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemProps = React.HTMLAttributes<HTMLDivElement>

/**
 * A form item component that provides context for form controls.
 */
const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(
  ({ className, ...props }, ref) => {
    const id = React.useId()

    return (
      <FormItemContext.Provider value={{ id }}>
        <div ref={ref} className={cn("space-y-2", className)} {...props} />
      </FormItemContext.Provider>
    )
  }
)
FormItem.displayName = "FormItem"

type FormLabelProps = React.ComponentPropsWithoutRef<typeof Label>

/**
 * A form label component that associates a label with a form control.
 */
const FormLabel = React.forwardRef<
  React.ComponentRef<typeof Label>,
  FormLabelProps
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-red-500 dark:text-red-400", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

type FormControlProps = React.HTMLAttributes<HTMLDivElement>

/**
 * A form control component that provides context for form elements.
 */
const FormControl = React.forwardRef<HTMLDivElement, FormControlProps>(
  ({ ...props }, ref) => {
    const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

    return (
      <div
        ref={ref}
        id={formItemId}
        aria-describedby={
          error
            ? `${formDescriptionId} ${formMessageId}`
            : `${formDescriptionId}`
        }
        aria-invalid={!!error}
        {...props}
      />
    )
  }
)
FormControl.displayName = "FormControl"

type FormDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>

/**
 * A form description component that provides additional information about a form field.
 */
const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  FormDescriptionProps
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-slate-500 dark:text-slate-400", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

type FormMessageProps = React.HTMLAttributes<HTMLParagraphElement> & {
  /**
   * Optional custom error message to display. If not provided, the error message
   * from the form state will be used.
   */
  error?: string
}

/**
 * A form message component that displays error messages for a form field.
 */
const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ className, error, ...props }, ref) => {
    const { error: fieldError, formMessageId } = useFormField()
    const errorMessage = error || fieldError?.message

    if (!errorMessage) {
      return null
    }

    return (
      <p
        ref={ref}
        id={formMessageId}
        className={cn("text-sm font-medium text-red-500 dark:text-red-400", className)}
        {...props}
      >
        {errorMessage}
      </p>
    )
  }
)
FormMessage.displayName = "FormMessage"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}