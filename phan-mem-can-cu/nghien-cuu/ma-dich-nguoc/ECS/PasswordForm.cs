using System;
using System.ComponentModel;
using System.Data;
using System.IO;
using System.Windows.Forms;
using ECS.ECSDataSetTableAdapters;
using ECS.Properties;

namespace ECS;

public class PasswordForm : Form
{
	private IContainer components;

	private Button okButton;

	public TextBox passTextBox;

	public TextBox repeatTextBox;

	public RadioButton userRadioButton;

	public RadioButton adminRadioButton;

	private ECSDataSet eCSDataSet;

	private PasswordTableAdapter passwordTableAdapter;

	private Label label1;

	private Label label2;

	protected override void Dispose(bool disposing)
	{
		if (disposing && components != null)
		{
			components.Dispose();
		}
		base.Dispose(disposing);
	}

	private void InitializeComponent()
	{
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.PasswordForm));
		this.label1 = new System.Windows.Forms.Label();
		this.label2 = new System.Windows.Forms.Label();
		this.passTextBox = new System.Windows.Forms.TextBox();
		this.repeatTextBox = new System.Windows.Forms.TextBox();
		this.userRadioButton = new System.Windows.Forms.RadioButton();
		this.adminRadioButton = new System.Windows.Forms.RadioButton();
		this.okButton = new System.Windows.Forms.Button();
		this.eCSDataSet = new ECS.ECSDataSet();
		this.passwordTableAdapter = new ECS.ECSDataSetTableAdapters.PasswordTableAdapter();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).BeginInit();
		base.SuspendLayout();
		resources.ApplyResources(this.label1, "label1");
		this.label1.Name = "label1";
		resources.ApplyResources(this.label2, "label2");
		this.label2.Name = "label2";
		resources.ApplyResources(this.passTextBox, "passTextBox");
		this.passTextBox.Name = "passTextBox";
		resources.ApplyResources(this.repeatTextBox, "repeatTextBox");
		this.repeatTextBox.Name = "repeatTextBox";
		resources.ApplyResources(this.userRadioButton, "userRadioButton");
		this.userRadioButton.Checked = true;
		this.userRadioButton.Name = "userRadioButton";
		this.userRadioButton.TabStop = true;
		this.userRadioButton.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.adminRadioButton, "adminRadioButton");
		this.adminRadioButton.Name = "adminRadioButton";
		this.adminRadioButton.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.okButton, "okButton");
		this.okButton.Name = "okButton";
		this.okButton.UseVisualStyleBackColor = true;
		this.okButton.Click += new System.EventHandler(okButton_Click);
		this.eCSDataSet.DataSetName = "ECSDataSet";
		this.eCSDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.passwordTableAdapter.ClearBeforeFill = true;
		base.AcceptButton = this.okButton;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.okButton);
		base.Controls.Add(this.adminRadioButton);
		base.Controls.Add(this.userRadioButton);
		base.Controls.Add(this.label2);
		base.Controls.Add(this.label1);
		base.Controls.Add(this.repeatTextBox);
		base.Controls.Add(this.passTextBox);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "PasswordForm";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		base.Load += new System.EventHandler(PasswordForm_Load);
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).EndInit();
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	public PasswordForm()
	{
		InitializeComponent();
	}

	private static void ChangeFilename(string filename)
	{
		if (filename.Length != 0)
		{
			Settings.Default.fileName = filename;
			Settings.Default.Save();
			string text = $"{Application.StartupPath}\\Config\\{Settings.Default.configFolder}\\{Settings.Default.fileName}.mdb";
			string text2 = $"{Application.StartupPath}\\Config\\{Settings.Default.configFolder}\\{Settings.Default.fileName}.sbp";
			string destFileName = Application.StartupPath + "\\ECS.mdb";
			string destFileName2 = Application.StartupPath + "\\ECS.sbp";
			if (File.Exists(text))
			{
				File.Copy(text, destFileName, overwrite: true);
				if (!File.Exists(text2))
				{
					File.Create(text2).Close();
				}
				File.Copy(text2, destFileName2, overwrite: true);
			}
		}
		else
		{
			string text3 = $"{Application.StartupPath}\\Config\\_ECS.mdb";
			string destFileName3 = Application.StartupPath + "\\ECS.mdb";
			if (File.Exists(text3))
			{
				File.Copy(text3, destFileName3, overwrite: true);
			}
		}
	}

	private void okButton_Click(object sender, EventArgs e)
	{
		if (passTextBox.Text != repeatTextBox.Text)
		{
			MessageBox.Show(this, Program.GetLang("pw_PasswordError"), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			TextBox textBox = passTextBox;
			string text = (repeatTextBox.Text = string.Empty);
			textBox.Text = text;
			passTextBox.Focus();
			return;
		}
		passwordTableAdapter.Fill(eCSDataSet.Password);
		ECSDataSet.PasswordRow passwordRow = eCSDataSet.Password.FindByID(userRadioButton.Checked ? 1 : 0);
		passwordRow.BeginEdit();
		passwordRow.Pass = passTextBox.Text.ToLower();
		passwordRow.EndEdit();
		try
		{
			passwordTableAdapter.Update(eCSDataSet.Password);
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
		MessageBox.Show(this, Program.GetLang("pw_OperationSuccess"), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Asterisk);
		base.DialogResult = DialogResult.OK;
	}

	private void PasswordForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_ChangePassword");
		adminRadioButton.Text = Program.GetLang("pw_AdminPassword");
		label1.Text = Program.GetLang("pw_InputPassword");
		label2.Text = Program.GetLang("pw_RepeatPassword");
		okButton.Text = Program.GetLang("pw_Modify");
		userRadioButton.Text = Program.GetLang("pw_UserPassword");
		Font = Settings.Default.CustomFont;
		adminRadioButton.Enabled = Program.right != Program.Right.User;
	}
}
