package com.vsa.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;

/**
 * Lookup entity representing the input type a Question uses (e.g. "TEXT", "MULTIPLE_CHOICE",
 * "CHECKBOX").
 *
 * <p>Rows in this table are seeded manually in the database — the API only ever reads from it, it
 * never creates, updates, or deletes question types.
 *
 * @author VSA Development Team
 */
@Getter
@Setter
@Entity
@Table(name = "question_types")
public class QuestionType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "question_type_id")
    private Long questionTypeId;

    /** The type name, e.g. "TEXT", "MULTIPLE_CHOICE", "CHECKBOX" */
    @Column(name = "type_name", nullable = false, unique = true)
    private String typeName;

    /** Frontend rendering config for this type (e.g. select options, max length), free-form JSON */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "input_config", columnDefinition = "jsonb")
    private Map<String, Object> inputConfig;
}