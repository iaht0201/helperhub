using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebTimViec.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddJobCategoryIdToJobPost : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "JobCategoryId",
                table: "JobPosts",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobPosts_JobCategoryId",
                table: "JobPosts",
                column: "JobCategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_JobPosts_JobCategories_JobCategoryId",
                table: "JobPosts",
                column: "JobCategoryId",
                principalTable: "JobCategories",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobPosts_JobCategories_JobCategoryId",
                table: "JobPosts");

            migrationBuilder.DropIndex(
                name: "IX_JobPosts_JobCategoryId",
                table: "JobPosts");

            migrationBuilder.DropColumn(
                name: "JobCategoryId",
                table: "JobPosts");
        }
    }
}
