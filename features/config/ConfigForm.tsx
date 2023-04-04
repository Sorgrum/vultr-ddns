import React from "react";
import { DeleteIcon } from "@chakra-ui/icons";
import {
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Button,
  Box,
  Flex,
  IconButton,
  Text,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { LocalConfig, localConfigSchema } from "./types";
import styles from "./ConfigForm.module.css";
import { useSavedConfig } from "./useSavedConfig";
import { toast } from "react-toastify";

export const ConfigForm = () => {
  const {
    handleSubmit,
    register,
    control,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<LocalConfig>({
    resolver: zodResolver(localConfigSchema),
  });

  const { loading, save, config } = useSavedConfig({
    onConfigUpdate: (config) => reset(config),
  });

  const { fields, append, remove } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormContext)
    name: "dynamicRecords", // unique name for your Field Array
  });

  const onSubmit = (config: LocalConfig) => {
    return save(config).then(() => toast.success("Config saved"));
  };

  const addDynamicRecord = () => {
    append({ record: "" });
  };

  const removeDynamicRecord = (index: number) => {
    remove(index);
  };

  const disabled = loading || isSubmitting;

  return (
    <>
      <Text fontSize="xl">Configuration</Text>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <FormControl
          isInvalid={!!errors["apiKey"]}
          mb={4}
          isDisabled={disabled}
        >
          <FormLabel htmlFor="apiKey">API Key</FormLabel>
          <Input id="apiKey" {...register("apiKey")} />
          <FormErrorMessage>
            <>{errors.apiKey?.message}</>
          </FormErrorMessage>
        </FormControl>

        <FormControl
          isInvalid={!!errors["domain"]}
          mb={4}
          isDisabled={disabled}
        >
          <FormLabel htmlFor="domain">Domain</FormLabel>
          <Input id="domain" {...register("domain")} />
          <FormErrorMessage>
            <>{errors.domain?.message}</>
          </FormErrorMessage>
        </FormControl>

        <FormControl isDisabled={disabled}>
          <FormLabel
            htmlFor="dynamicRecords"
            style={{ display: "flex", alignItems: "center" }}
          >
            <Text pr={4}>Dynamic Records</Text>
            <Button onClick={addDynamicRecord} isDisabled={disabled}>
              Add record
            </Button>
          </FormLabel>
          {fields.length === 0 ? (
            <Box
              mt={4}
              mb={4}
              className={disabled ? styles.disabledText : undefined}
            >
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
                disabled={disabled}
                onClick={() => removeDynamicRecord(index)}
                ml={2}
              />
            </Flex>
          ))}
          <FormErrorMessage>
            <>{errors.dynamicRecords?.message}</>
          </FormErrorMessage>
        </FormControl>

        <Button
          colorScheme={isDirty ? "blue" : "gray"}
          isLoading={isSubmitting}
          isDisabled={disabled}
          type="submit"
          mt={2}
        >
          Save
        </Button>
      </form>
    </>
  );
};
