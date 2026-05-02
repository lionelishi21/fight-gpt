/**
 * Character Encyclopedia Data Validation Script
 * Validates CharacterEncyclopedia documents for data integrity
 */
import { ICharacterEncyclopediaDocument } from '../models/CharacterEncyclopedia';
/**
 * Validation result interface
 */
interface ValidationResult {
    documentId: string;
    gameId: string;
    characterId: string;
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
/**
 * Validate a single CharacterEncyclopedia document
 */
declare function validateDocument(doc: ICharacterEncyclopediaDocument): ValidationResult;
/**
 * Validate all CharacterEncyclopedia documents
 */
declare function validateAllDocuments(): Promise<void>;
export { validateAllDocuments, validateDocument };
//# sourceMappingURL=validateCharacterEncyclopedia.d.ts.map