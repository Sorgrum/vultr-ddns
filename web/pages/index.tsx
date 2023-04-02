import Head from "next/head";
import { useFieldArray, useForm } from "react-hook-form";
import styles from "@/styles/Home.module.css";
import React from "react";
import {
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Button,
  Box,
  IconButton,
  Text,
  Flex,
} from "@chakra-ui/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { DeleteIcon } from "@chakra-ui/icons";

const formSchema = z.object({
  apiKey: z.string().length(36),
  domain: z.string().min(1),
  dynamicRecords: z.array(z.object({ record: z.string() })),
});
type FormData = z.infer<typeof formSchema>;

export default function Home() {
  const {
    handleSubmit,
    register,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormContext)
    name: "dynamicRecords", // unique name for your Field Array
  });

  const onSubmit = (values: FormData) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        alert(JSON.stringify(values, null, 2));
        resolve();
      }, 3000);
    });
  };

  const addDynamicRecord = () => {
    append({ record: "" });
  };

  const removeDynamicRecord = (index: number) => {
    remove(index);
  };

  return (
    <>
      <Head>
        <title>Vultr DDNS</title>
        <meta name="description" content="DDNS for Vultr" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div className={styles.grid}>
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <FormControl isInvalid={!!errors["apiKey"]} mb={4}>
              <FormLabel htmlFor="apiKey">API Key</FormLabel>
              <Input id="apiKey" {...register("apiKey")} />
              <FormErrorMessage>
                <>{errors.apiKey?.message}</>
              </FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors["domain"]} mb={4}>
              <FormLabel htmlFor="domain">Domain</FormLabel>
              <Input id="domain" placeholder="domain" {...register("domain")} />
              <FormErrorMessage>
                <>{errors.domain?.message}</>
              </FormErrorMessage>
            </FormControl>
            <FormControl>
              <FormLabel
                htmlFor="dynamicRecords"
                style={{ display: "flex", alignItems: "center" }}
              >
                <Text pr={4}>Dynamic Records</Text>
                <Button onClick={addDynamicRecord}>Add record</Button>
              </FormLabel>
              {fields.length === 0 ? (
                <Box mt={4} mb={4}>
                  No dynamic records.
                </Box>
              ) : null}
              {fields.map((field, index) => (
                <Flex key={field.id}>
                  <Input
                    mb={2}
                    placeholder="@"
                    {...register(`dynamicRecords.${index}.record`)}
                  />
                  <IconButton
                    aria-label={`Delete dynamic record`}
                    icon={<DeleteIcon />}
                    onClick={() => removeDynamicRecord(index)}
                    ml={2}
                  />
                </Flex>
              ))}
            </FormControl>
            <Button
              colorScheme="teal"
              isLoading={isSubmitting}
              type="submit"
              mt={2}
            >
              Submit
            </Button>
          </form>
        </div>
      </main>
    </>
  );
}
