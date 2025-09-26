import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JobsService } from './jobs.service';
import { GeneratedCertificatesService } from '../../generated-certificates/services/generated-certificates.service';

@Injectable()
export class JobSchedulerService {
  private readonly logger = new Logger(JobSchedulerService.name);
  private isProcessing = false;
  private isProcessingPending = false;

  constructor(
    private readonly jobsService: JobsService,
    private readonly generatedCertificatesService: GeneratedCertificatesService,
  ) {}

  /**
   * Cron job que se ejecuta cada 5 minutos para procesar jobs pendientes
   * Incluye lógica para prevenir ejecuciones concurrentes
   */
  @Cron(CronExpression.EVERY_5_MINUTES, {
    name: 'processEmailJobs',
    timeZone: 'America/Bogota', // Ajusta según tu zona horaria
  })
  async handleProcessEmailJobs(): Promise<void> {
    // Prevenir ejecuciones concurrentes
    if (this.isProcessing) {
      this.logger.warn(
        'Job processing already in progress, skipping this execution',
      );
      return;
    }

    this.isProcessing = true;
    const startTime = new Date();

    try {
      this.logger.log('Starting automatic email job processing...');

      // Procesar jobs pendientes
      const result = await this.jobsService.processPendingJobs();

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      this.logger.log(
        `Email job processing completed in ${duration}ms. ` +
          `Processed: ${result.processed}, ` +
          `Successful: ${result.successful}, ` +
          `Failed: ${result.failed}`,
      );

      // Log warning si hay muchos jobs fallidos
      if (result.failed > 0) {
        this.logger.warn(
          `${result.failed} jobs failed during processing. Check job error messages for details.`,
        );
      }

      // Log info si no hay jobs para procesar
      if (result.processed === 0) {
        this.logger.debug('No pending jobs found to process');
      }
    } catch (error) {
      this.logger.error(
        'Unexpected error during automatic job processing',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      // Siempre liberar el flag de procesamiento
      this.isProcessing = false;
    }
  }

  /**
   * Cron job que se ejecuta cada 5 minutos para procesar certificados pendientes
   * Crea jobs para certificados que no tienen jobs asociados
   * Procesa en lotes para evitar timeouts con miles de registros
   */
  @Cron('*/5 * * * *', {
    name: 'processPendingCertificates',
    timeZone: 'America/Bogota',
  })
  async handleProcessPendingCertificates(): Promise<void> {
    // Prevenir ejecuciones concurrentes
    if (this.isProcessingPending) {
      this.logger.warn(
        'Pending certificates processing already in progress, skipping this execution',
      );
      return;
    }

    this.isProcessingPending = true;
    const startTime = new Date();

    try {
      this.logger.log('Starting automatic pending certificates processing...');

      // Procesar certificados pendientes en lotes
      const result = await this.processPendingCertificatesInBatches();

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      this.logger.log(
        `Pending certificates processing completed in ${duration}ms. ` +
          `Total certificates: ${result.totalCertificates}, ` +
          `Jobs created: ${result.jobsCreated}, ` +
          `Already processed: ${result.alreadyProcessed}`,
      );

      // Alertar si hay muchos certificados pendientes
      if (result.totalCertificates > 100) {
        this.logger.warn(
          `High number of pending certificates detected: ${result.totalCertificates}. Consider reviewing certificate generation process.`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Unexpected error during pending certificates processing',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      // Siempre liberar el flag de procesamiento
      this.isProcessingPending = false;
    }
  }

  /**
   * Procesa certificados pendientes en lotes para evitar timeouts
   * Procesa máximo 50 certificados por lote con pausas entre lotes
   */
  private async processPendingCertificatesInBatches(): Promise<{
    totalCertificates: number;
    jobsCreated: number;
    alreadyProcessed: number;
  }> {
    const BATCH_SIZE = 50;
    const BATCH_DELAY = 1000; // 1 segundo entre lotes

    let totalJobsCreated = 0;
    let totalAlreadyProcessed = 0;
    let totalCertificates = 0;
    let processedInCurrentRun = 0;

    do {
      // Procesar un lote
      const result =
        await this.generatedCertificatesService.processPendingCertificatesBatch(
          BATCH_SIZE,
        );

      totalJobsCreated += result.data.jobsCreated;
      totalAlreadyProcessed += result.data.alreadyProcessed;
      processedInCurrentRun =
        result.data.jobsCreated + result.data.alreadyProcessed;
      totalCertificates += processedInCurrentRun;

      this.logger.debug(
        `Processed batch: ${result.data.jobsCreated} jobs created, ${result.data.alreadyProcessed} already processed`,
      );

      // Pausa entre lotes para no sobrecargar el sistema
      if (processedInCurrentRun >= BATCH_SIZE) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
      }
    } while (processedInCurrentRun >= BATCH_SIZE); // Continuar mientras haya lotes completos

    return {
      totalCertificates,
      jobsCreated: totalJobsCreated,
      alreadyProcessed: totalAlreadyProcessed,
    };
  }

  /**
   * Cron job adicional que se ejecuta cada hora para limpiar jobs muy antiguos
   * y generar estadísticas de rendimiento
   */
  @Cron(CronExpression.EVERY_HOUR, {
    name: 'jobMaintenance',
    timeZone: 'America/Bogota',
  })
  async handleJobMaintenance(): Promise<void> {
    try {
      this.logger.log('Running job maintenance tasks...');

      // Obtener estadísticas generales
      const stats = await this.jobsService.getJobStats();

      this.logger.log(
        `Job Statistics - Total: ${stats.total}, ` +
          `Pending: ${stats.pending}, ` +
          `Sent: ${stats.sent}, ` +
          `Error: ${stats.error}, ` +
          `Success Rate: ${stats.successRate}%`,
      );

      // Alertar si hay demasiados jobs pendientes
      if (stats.pending > 50) {
        this.logger.warn(
          `High number of pending jobs detected: ${stats.pending}. Consider checking system health.`,
        );
      }

      // Alertar si la tasa de éxito es muy baja
      if (stats.successRate < 85 && stats.total > 10) {
        this.logger.warn(
          `Low success rate detected: ${stats.successRate}%. Check email service configuration.`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Error during job maintenance',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * Obtener el estado actual del scheduler
   * Útil para debugging y monitoreo
   */
  getSchedulerStatus(): {
    isProcessing: boolean;
    nextExecutionIn: string;
  } {
    // Calcular tiempo hasta próxima ejecución (cada 5 minutos)
    const now = new Date();
    const nextMinute = new Date(now);
    nextMinute.setMinutes(
      Math.ceil((nextMinute.getMinutes() + 1) / 5) * 5,
      0,
      0,
    );
    const msUntilNext = nextMinute.getTime() - now.getTime();
    const minutesUntilNext = Math.round(msUntilNext / (1000 * 60));

    return {
      isProcessing: this.isProcessing,
      nextExecutionIn: `${minutesUntilNext} minutes`,
    };
  }

  /**
   * Forzar procesamiento manual (útil para testing y debugging)
   * Solo debe usarse en casos excepcionales
   */
  async forceProcessJobs(): Promise<void> {
    if (this.isProcessing) {
      throw new Error(
        'Cannot force processing while automatic processing is running',
      );
    }

    this.logger.log('Manual job processing triggered');
    await this.handleProcessEmailJobs();
  }
}
