"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { useRouter } from "@/lib/navigation"
import { PrivateStrapiClient } from "@/lib/strapi-api"
import { AppField } from "@/components/forms/AppField"
import { AppForm } from "@/components/forms/AppForm"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgotPassword")
  const router = useRouter()
  const { toast } = useToast()

  const { mutate } = useMutation({
    mutationFn: (values: { email: string }) => {
      return PrivateStrapiClient.fetchAPI(
        `/auth/forgot-password`,
        undefined,
        {
          body: JSON.stringify(values),
          method: "POST",
          next: { revalidate: 0 },
        },
        { omitUserAuthorization: true }
      )
    },
  })

  const form = useForm<z.infer<FormSchemaType>>({
    resolver: zodResolver(ForgotPasswordFormSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { email: "" },
  })

  const onSubmit = (data: z.infer<FormSchemaType>) =>
    mutate(data, {
      onSuccess: () => {
        toast({
          variant: "default",
          description: t("passwordChangeEmailSent"),
        })
        form.reset()
        router.push("/auth/signin")
      },
    })

  return (
    <Card className="m-auto w-[400px]">
      <CardHeader>
        <CardTitle>{t("header")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <AppForm form={form} onSubmit={onSubmit} id={forgotPasswordFormName}>
          <AppField name="email" type="email" required label={t("email")} />
        </AppForm>
      </CardContent>
      <CardFooter>
        <Button
          type="submit"
          size="lg"
          variant="default"
          form={forgotPasswordFormName}
        >
          {t("submit")}
        </Button>
      </CardFooter>
    </Card>
  )
}

const ForgotPasswordFormSchema = z.object({
  email: z.string().min(1).email(),
})

type FormSchemaType = typeof ForgotPasswordFormSchema

const forgotPasswordFormName = "forgottenPasswordForm"
